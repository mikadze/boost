import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract correlation ID from request context
 * Set by CorrelationIdMiddleware
 */
export const CorrelationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.correlationId || 'unknown';
  },
);
