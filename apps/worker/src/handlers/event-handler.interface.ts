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
   * Process the event
   * @throws Error if processing fails
   */
  handle(event: RawEventMessage): Promise<void>;
}

/**
 * Token for injecting all event handlers
 */
export const EVENT_HANDLERS = Symbol('EVENT_HANDLERS');
