import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Track Event Schema
 * Validates incoming event data for the ingestion endpoint
 * Accepts either 'event' or 'type' for the event name (SDK sends 'type')
 */
const TrackEventSchema = z
  .object({
    // User ID - required identifier from the client system
    userId: z.string().min(1, 'userId is required'),

    // Event name - accepts either 'event' or 'type' field
    event: z.string().min(1).optional(),
    type: z.string().min(1).optional(),

    // Traits/properties - optional metadata object
    traits: z.record(z.unknown()).optional(),
    properties: z.record(z.unknown()).optional(),

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
  })
  .transform((data) => ({
    userId: data.userId,
    // Prefer 'event' over 'type', but accept both
    event: data.event || data.type || '',
    // Prefer 'traits' over 'properties', but accept both
    traits: data.traits || data.properties || {},
    timestamp: data.timestamp,
  }))
  .refine((data) => data.event.length > 0, {
    message: 'event or type is required',
    path: ['event'],
  });

export class TrackEventDto extends createZodDto(TrackEventSchema) {}

// Export the schema for reuse
export { TrackEventSchema };
