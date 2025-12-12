/**
 * Typed Kafka message for raw events
 * Shared between API (producer) and Worker (consumer)
 */
export interface RawEventMessage {
  id: string;
  projectId: string;
  eventType: string;
  userId?: string;
  payload: Record<string, unknown>;
}

/**
 * Event processing status
 */
export type EventStatus = 'pending' | 'processed' | 'failed';
