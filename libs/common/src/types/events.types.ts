import { EventSource } from './event-classification';

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
  /**
   * Event source indicating how the event was sent:
   * - 'server': Sent with secret key (sk_live_*) from server-side
   * - 'client': Sent with publishable key (pk_live_*) from client-side
   *
   * Used for defense-in-depth validation in workers for financial events.
   * Note: May be undefined for events ingested before this field was added.
   */
  _source?: EventSource;
}

/**
 * Event processing status
 */
export type EventStatus = 'pending' | 'processed' | 'failed';
