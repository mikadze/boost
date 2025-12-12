import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract current project ID from request context
 * Set by ApiKeyGuard
 */
export const CurrentProjectId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.projectId;
  },
);
