import { Injectable, Logger } from '@nestjs/common';
import { RawEventMessage } from '@boost/common';
import { EventHandler } from './event-handler.interface';

/**
 * Default handler for unknown event types.
 * Acts as a catch-all for events without specific handlers.
 */
@Injectable()
export class DefaultEventHandler implements EventHandler {
  private readonly logger = new Logger(DefaultEventHandler.name);

  /**
   * Returns empty array - this handler is used as fallback
   */
  getSupportedTypes(): string[] {
    return [];
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Processing generic event: ${event.event}`);

    // Generic event processing - store and acknowledge
  }
}
