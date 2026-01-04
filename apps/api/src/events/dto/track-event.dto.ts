import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  IsArray,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Track Event DTO
 * Validates incoming event data for the ingestion endpoint
 * Accepts either 'event' or 'type' for the event name (SDK sends 'type')
 * Accepts either 'traits' or 'properties' for metadata (SDK sends 'properties')
 */
export class TrackEventDto {
  // User ID - required identifier from the client system
  @IsString()
  @IsNotEmpty({ message: 'userId is required' })
  userId!: string;

  // Event name - accepts either 'event' or 'type' field
  // At least one must be provided
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  event?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  // Traits/properties - optional metadata object
  // Accepts either 'traits' or 'properties'
  @IsOptional()
  @IsObject()
  traits?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  // Timestamp - optional, allows backdating events
  // Accepts ISO 8601 strings or epoch milliseconds
  // Transforms to ISO 8601 string
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return new Date().toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    return value;
  })
  timestamp?: string;

  // Anonymous ID - optional, used by SDK for anonymous tracking
  @IsOptional()
  @IsString()
  anonymousId?: string;

  /**
   * Get the normalized event name (prefers 'event' over 'type')
   */
  getEventName(): string {
    return this.event || this.type || '';
  }

  /**
   * Get the normalized traits (prefers 'traits' over 'properties')
   */
  getTraits(): Record<string, unknown> {
    return this.traits || this.properties || {};
  }

  /**
   * Get the timestamp, defaulting to now if not provided
   */
  getTimestamp(): string {
    return this.timestamp || new Date().toISOString();
  }
}

/**
 * Batch Event DTO
 * Validates an array of events for batch ingestion
 */
export class BatchEventDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  events!: TrackEventDto[];
}
