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
import { ApiKeyType } from '@boost/database';
import * as crypto from 'crypto';

/**
 * Cached API key data including type for authorization
 */
interface CachedApiKeyData {
  projectId: string;
  type: ApiKeyType;
}

/**
 * High-performance API Key Guard with Redis caching
 * L1: Redis cache (TTL 60s)
 * L2: Database lookup
 *
 * Attaches both projectId and apiKeyType to the request for downstream use
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

    // Hash the key once - used for both cache lookup and DB operations
    // SECURITY: Never store raw API key in cache keys to prevent exposure via Redis
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    // L1: Check Redis cache using hash (not raw key)
    const cacheKey = `apikey:${keyHash}`;
    const cachedData = await this.cacheManager.get<CachedApiKeyData>(cacheKey);

    if (cachedData) {
      request.projectId = cachedData.projectId;
      request.apiKeyType = cachedData.type;
      return true;
    }

    // L2: Database lookup
    const result = await this.apiKeyService.validateKey(rawKey);

    if (!result) {
      throw new UnauthorizedException('Invalid API Key');
    }

    // Update last used timestamp (fire-and-forget)
    this.apiKeyService.updateLastUsed(keyHash).catch((err) => {
      console.error('Failed to update last used timestamp:', err);
    });

    // Cache both projectId and type using hash as key (TTL 60 seconds)
    const cacheData: CachedApiKeyData = {
      projectId: result.projectId,
      type: result.type,
    };
    await this.cacheManager.set(cacheKey, cacheData, 60000);

    // Attach to request
    request.projectId = result.projectId;
    request.apiKeyType = result.type;

    return true;
  }
}
