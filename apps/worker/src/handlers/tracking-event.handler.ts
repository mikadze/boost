import { Injectable, Logger } from '@nestjs/common';
import { RawEventMessage } from '@boost/common';
import { EventHandler } from './event-handler.interface';

/**
 * Handles tracking events: page_view, click, form_submit
 */
@Injectable()
export class TrackingEventHandler implements EventHandler {
  private readonly logger = new Logger(TrackingEventHandler.name);

  getSupportedTypes(): string[] {
    return ['page_view', 'click', 'form_submit'];
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Processing tracking event: ${event.event}`);

    // TODO: Implement tracking-specific logic
    // Examples: analytics aggregation, session tracking, funnel analysis
  }
}
