/**
 * Typed Kafka message for raw events
 * Shared between API (producer) and Worker (consumer)
 * Format aligned with Issue #3 Events Ingestion spec
 */
export interface RawEventMessage {
  projectId: string;
  userId: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  receivedAt: string;
}

/**
 * Event processing status
 */
export type EventStatus = 'pending' | 'processed' | 'failed';
