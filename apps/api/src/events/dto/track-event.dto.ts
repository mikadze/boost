import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Track Event Schema
 * Validates incoming event data for the ingestion endpoint
 */
const TrackEventSchema = z.object({
  // User ID - required identifier from the client system
  userId: z.string().min(1, 'userId is required'),

  // Event name - required event type identifier
  event: z.string().min(1, 'event name is required'),

  // Traits/properties - optional metadata object
  traits: z.record(z.unknown()).optional(),

  // Timestamp - optional, allows backdating events
  // Accepts ISO 8601 strings or epoch milliseconds
  timestamp: z
    .union([z.string().datetime(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined) return new Date().toISOString();
      if (typeof val === 'number') return new Date(val).toISOString();
      return val;
    }),
});

export class TrackEventDto extends createZodDto(TrackEventSchema) {}

// Export the schema for reuse
export { TrackEventSchema };
