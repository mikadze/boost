import { Injectable, Logger } from '@nestjs/common';
import { EventRepository } from '@boost/database';
import { RawEventMessage } from '@boost/common';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(private readonly eventRepository: EventRepository) {}

  async processEvent(rawEvent: RawEventMessage): Promise<void> {
    try {
      this.logger.log(
        `Processing event: ${rawEvent.id} (${rawEvent.eventType})`,
      );

      // Route events to specific handlers based on eventType
      await this.handleEventByType(rawEvent);

      // Update event status to processed via repository
      await this.eventRepository.markAsProcessed(rawEvent.id);

      this.logger.log(`Event ${rawEvent.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing event ${rawEvent.id}:`, error);

      // Update event status to failed with error details via repository
      // Note: We don't re-throw here to prevent Kafka from retrying
      // since we've already marked the event as failed in the database
      await this.eventRepository.markAsFailed(
        rawEvent.id,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async handleEventByType(event: RawEventMessage): Promise<void> {
    // Route events based on type
    switch (event.eventType) {
      case 'page_view':
      case 'click':
      case 'form_submit':
        // Handle tracking events
        break;
      case 'user_signup':
      case 'user_login':
        // Handle user events
        break;
      default:
        // Generic event handling
        break;
    }
  }
}
