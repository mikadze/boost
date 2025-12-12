import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { BETTER_AUTH } from '../auth/better-auth.module';

/**
 * Session Guard for dashboard (human) authentication
 * Validates session cookies using Better-Auth
 * Sets user and organization context on request
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(BETTER_AUTH) private auth: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      // Get session from Better-Auth using request headers/cookies
      const session = await this.auth.api.getSession({
        headers: request.headers,
      });

      if (!session || !session.user) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Attach user to request for downstream handlers
      request.user = session.user;
      request.session = session.session;

      // If organization context is available, attach it
      if (session.session?.activeOrganizationId) {
        request.organizationId = session.session.activeOrganizationId;
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
