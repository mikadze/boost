import type { QueuedEvent, GamifyEvent, StorageAdapter } from '../types.js';

const QUEUE_STORAGE_KEY = 'event_queue';
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Generates a unique ID for queued events
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Event queue for reliable event delivery with offline support
 */
export class EventQueue {
  private queue: QueuedEvent[] = [];
  private readonly maxSize: number;
  private readonly storage: StorageAdapter;

  constructor(storage: StorageAdapter, maxSize: number = 100) {
    this.storage = storage;
    this.maxSize = maxSize;
    this.loadFromStorage();
  }

  /**
   * Load persisted queue from storage
   */
  private loadFromStorage(): void {
    const persisted = this.storage.get<QueuedEvent[]>(QUEUE_STORAGE_KEY);
    if (persisted && Array.isArray(persisted)) {
      this.queue = persisted;
    }
  }

  /**
   * Persist queue to storage
   */
  private saveToStorage(): void {
    this.storage.set(QUEUE_STORAGE_KEY, this.queue);
  }

  /**
   * Add an event to the queue
   */
  enqueue(event: GamifyEvent): string {
    const queuedEvent: QueuedEvent = {
      id: generateId(),
      event,
      attempts: 0,
      createdAt: Date.now(),
    };

    this.queue.push(queuedEvent);

    // Trim queue if it exceeds max size (FIFO - remove oldest)
    while (this.queue.length > this.maxSize) {
      this.queue.shift();
    }

    this.saveToStorage();
    return queuedEvent.id;
  }

  /**
   * Get events ready for sending (batch)
   */
  peek(count: number): QueuedEvent[] {
    return this.queue
      .filter((item) => item.attempts < MAX_RETRY_ATTEMPTS)
      .slice(0, count);
  }

  /**
   * Mark events as successfully sent and remove from queue
   */
  acknowledge(ids: string[]): void {
    const idSet = new Set(ids);
    this.queue = this.queue.filter((item) => !idSet.has(item.id));
    this.saveToStorage();
  }

  /**
   * Mark events as failed (increment retry count)
   */
  nack(ids: string[]): void {
    const idSet = new Set(ids);
    for (const item of this.queue) {
      if (idSet.has(item.id)) {
        item.attempts++;
      }
    }
    // Remove events that exceeded max retries
    this.queue = this.queue.filter((item) => item.attempts < MAX_RETRY_ATTEMPTS);
    this.saveToStorage();
  }

  /**
   * Get current queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue has pending events
   */
  hasPending(): boolean {
    return this.queue.some((item) => item.attempts < MAX_RETRY_ATTEMPTS);
  }

  /**
   * Clear all events from queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }
}
