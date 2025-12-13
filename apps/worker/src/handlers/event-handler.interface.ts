import { RawEventMessage } from '@boost/common';

/**
 * Strategy interface for event handlers.
 * Each handler processes specific event types.
 */
export interface EventHandler {
  /**
   * Returns the event types this handler can process
   */
  getSupportedTypes(): string[];

  /**
   * Optional method to check if this handler should process the event.
   * Useful for handlers that need to evaluate events dynamically
   * beyond just matching event types (e.g., quest progress handler).
   */
  shouldHandle?(event: RawEventMessage): Promise<boolean>;

  /**
   * Process the event
   * @throws Error if processing fails
   */
  handle(event: RawEventMessage): Promise<void>;
}

/**
 * Token for injecting all event handlers
 */
export const EVENT_HANDLERS = Symbol('EVENT_HANDLERS');
