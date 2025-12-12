import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract the current authenticated user from request
 * Used with SessionGuard for dashboard endpoints
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * Extract the current organization ID from request
 * Set by SessionGuard when user has an active organization
 */
export const CurrentOrganizationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organizationId;
  },
);
