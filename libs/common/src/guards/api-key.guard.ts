import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiKeyService } from '../auth/api-key.service';
import * as crypto from 'crypto';

/**
 * High-performance API Key Guard with Redis caching
 * L1: Redis cache (TTL 60s)
 * L2: Database lookup
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private apiKeyService: ApiKeyService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];

    if (!rawKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    // L1: Check Redis cache
    const cacheKey = `apikey:${rawKey}`;
    const cachedProjectId = await this.cacheManager.get<string>(cacheKey);

    if (cachedProjectId) {
      request.projectId = cachedProjectId;
      return true;
    }

    // L2: Database lookup
    const result = await this.apiKeyService.validateKey(rawKey);

    if (!result) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Update last used timestamp (fire-and-forget)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    this.apiKeyService.updateLastUsed(keyHash).catch((err) => {
      console.error('Failed to update last used timestamp:', err);
    });

    // Cache the projectId (TTL 60 seconds)
    await this.cacheManager.set(cacheKey, result.projectId, 60000); // 60 seconds in ms

    // Attach to request
    request.projectId = result.projectId;

    return true;
  }
}
