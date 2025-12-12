/**
 * Configuration options for the Gamify SDK
 */
export interface GamifyConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the API endpoint */
  endpoint?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Flush interval in milliseconds (default: 10000) */
  flushInterval?: number;
  /** Maximum events to batch before auto-flush (default: 10) */
  maxBatchSize?: number;
  /** Storage key prefix (default: 'gamify_') */
  storagePrefix?: string;
}

/**
 * Event payload structure
 */
export interface GamifyEvent {
  /** Event type (e.g., 'page_view', 'click', 'purchase') */
  type: string;
  /** Event properties */
  properties?: Record<string, unknown>;
  /** Timestamp when event occurred */
  timestamp: string;
  /** User ID if identified */
  userId?: string;
  /** Anonymous ID for unidentified users */
  anonymousId: string;
}

/**
 * User traits for identify calls
 */
export interface UserTraits {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Internal queued event with metadata
 */
export interface QueuedEvent {
  id: string;
  event: GamifyEvent;
  attempts: number;
  createdAt: number;
}

/**
 * API response structure
 */
export interface ApiResponse {
  success: boolean;
  error?: string;
}

/**
 * Storage interface for persistence layer
 */
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}
