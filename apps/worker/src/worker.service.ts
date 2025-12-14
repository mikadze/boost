import { Injectable, Logger } from '@nestjs/common';
import { EventRepository } from '@boost/database';
import { RawEventMessage } from '@boost/common';
import {
  EventHandlerRegistry,
  QuestProgressEventHandler,
  StreakEventHandler,
  BadgeEventHandler,
} from './handlers';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly handlerRegistry: EventHandlerRegistry,
    private readonly questProgressHandler: QuestProgressEventHandler,
    private readonly streakEventHandler: StreakEventHandler,
    private readonly badgeEventHandler: BadgeEventHandler,
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

      // Issue #32: Check for streak progress on ALL events
      // This runs separately from the main dispatch to evaluate streak triggers
      try {
        if (await this.streakEventHandler.shouldHandle(rawEvent)) {
          await this.streakEventHandler.handle(rawEvent);
        }
      } catch (streakError) {
        // Log but don't fail the event processing if streak evaluation fails
        this.logger.warn(`Streak progress evaluation failed: ${streakError}`);
      }

      // Issue #33: Check for badge awards on ALL events
      // Evaluates if any badges should be awarded based on event triggers
      try {
        if (await this.badgeEventHandler.shouldHandle(rawEvent)) {
          await this.badgeEventHandler.handle(rawEvent);
        }
      } catch (badgeError) {
        // Log but don't fail the event processing if badge evaluation fails
        this.logger.warn(`Badge evaluation failed: ${badgeError}`);
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
