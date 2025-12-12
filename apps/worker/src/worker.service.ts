import { Injectable, Logger } from '@nestjs/common';
import { getDrizzleClient, events } from '@boost/database';
import { RawEventMessage } from '@boost/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  async processEvent(rawEvent: RawEventMessage): Promise<void> {
    const db = getDrizzleClient();

    try {
      this.logger.log(
        `Processing event: ${rawEvent.id} (${rawEvent.eventType})`,
      );

      // TODO: Implement actual event processing logic here
      // This is where you would route events to specific handlers
      // based on eventType, update analytics, trigger webhooks, etc.
      await this.handleEventByType(rawEvent);

      // Update event status to processed
      await db
        .update(events)
        .set({
          status: 'processed',
          processedAt: new Date(),
        })
        .where(eq(events.id, rawEvent.id));

      this.logger.log(`Event ${rawEvent.id} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing event ${rawEvent.id}:`, error);

      // Update event status to failed with error details
      // Note: We don't re-throw here to prevent Kafka from retrying
      // since we've already marked the event as failed in the database
      await db
        .update(events)
        .set({
          status: 'failed',
          errorDetails: error instanceof Error ? error.message : String(error),
        })
        .where(eq(events.id, rawEvent.id));
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
