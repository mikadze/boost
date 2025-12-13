import { Injectable, Logger } from '@nestjs/common';
import { EventRepository } from '@boost/database';
import { RawEventMessage } from '@boost/common';
import { EventHandlerRegistry, QuestProgressEventHandler } from './handlers';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly handlerRegistry: EventHandlerRegistry,
    private readonly questProgressHandler: QuestProgressEventHandler,
  ) {}

  /**
   * Process an event from Kafka
   * The API sends events directly to Kafka without DB writes,
   * so the worker is responsible for persistence
   */
  async processEvent(rawEvent: RawEventMessage): Promise<void> {
    let eventId: string | undefined;

    try {
      this.logger.log(
        `Processing event: ${rawEvent.event} for project ${rawEvent.projectId}`,
      );

      // First, persist the event to database
      const result = await this.eventRepository.create({
        projectId: rawEvent.projectId,
        eventType: rawEvent.event,
        userId: rawEvent.userId,
        payload: {
          ...rawEvent.properties,
          timestamp: rawEvent.timestamp,
          receivedAt: rawEvent.receivedAt,
        },
      });
      eventId = result.id;

      // Dispatch to appropriate handler via Strategy pattern
      await this.handlerRegistry.dispatch(rawEvent);

      // Issue #25-29: Check for quest progress on ALL events
      // This runs separately from the main dispatch to evaluate quest step triggers
      try {
        if (await this.questProgressHandler.shouldHandle(rawEvent)) {
          await this.questProgressHandler.handle(rawEvent);
        }
      } catch (questError) {
        // Log but don't fail the event processing if quest evaluation fails
        this.logger.warn(`Quest progress evaluation failed: ${questError}`);
      }

      // Update event status to processed via repository
      await this.eventRepository.markAsProcessed(eventId);

      this.logger.log(`Event ${eventId} processed successfully`);
    } catch (error) {
      this.logger.error(`Error processing event:`, error);

      // If we have an event ID, mark it as failed
      if (eventId) {
        await this.eventRepository.markAsFailed(
          eventId,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }
}
