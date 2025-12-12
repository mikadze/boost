import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

// Extend Express Request type to include correlationId
interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

/**
 * Middleware to ensure every request has a correlation ID for tracing
 * If the client provides one, it's used; otherwise a new one is generated
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: RequestWithCorrelationId, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

    // Attach to request for use in services
    req.correlationId = correlationId;

    // Set on response headers for client tracking
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}

/**
 * Helper to get correlation ID from request
 */
export function getCorrelationId(req: RequestWithCorrelationId): string {
  return req.correlationId || 'unknown';
}
