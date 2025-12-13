import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiKeyType } from '@boost/database';

/**
 * Decorator to extract current API key type from request context
 * Set by ApiKeyGuard
 *
 * Returns 'publishable' or 'secret'
 */
export const CurrentApiKeyType = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): ApiKeyType => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKeyType;
  },
);
