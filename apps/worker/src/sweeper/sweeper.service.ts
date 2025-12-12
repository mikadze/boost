import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { EventRepository, EventRecord } from '@boost/database';
import { RawEventMessage } from '@boost/common';

/**
 * Sweeper job that recovers stuck pending events.
 *
 * Handles the edge case where createEvent inserts into DB
 * but fails to emit to Kafka (network failure, Kafka down, etc.)
 *
 * Runs periodically to find and re-emit these orphaned events.
 */
@Injectable()
export class SweeperService implements OnModuleInit {
  private readonly logger = new Logger(SweeperService.name);
  private intervalId: NodeJS.Timeout | null = null;

  // Configuration
  private readonly SWEEP_INTERVAL_MS = 60_000; // Run every minute
  private readonly STUCK_THRESHOLD_MINUTES = 5; // Events pending > 5 min are stuck
  private readonly BATCH_SIZE = 100; // Process 100 events per sweep

  constructor(
    private readonly eventRepository: EventRepository,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit(): void {
    this.startSweeper();
  }

  private startSweeper(): void {
    this.logger.log(
      `Starting sweeper job (interval: ${this.SWEEP_INTERVAL_MS}ms, threshold: ${this.STUCK_THRESHOLD_MINUTES}min)`,
    );

    // Run immediately on startup
    this.sweep().catch((err) =>
      this.logger.error('Initial sweep failed:', err),
    );

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.sweep().catch((err) =>
        this.logger.error('Scheduled sweep failed:', err),
      );
    }, this.SWEEP_INTERVAL_MS);
  }

  async sweep(): Promise<void> {
    this.logger.debug('Starting sweep for stuck pending events...');

    try {
      const stuckEvents = await this.eventRepository.findStuckPendingEvents(
        this.STUCK_THRESHOLD_MINUTES,
        this.BATCH_SIZE,
      );

      if (stuckEvents.length === 0) {
        this.logger.debug('No stuck events found');
        return;
      }

      this.logger.log(`Found ${stuckEvents.length} stuck pending events`);

      let recovered = 0;
      let failed = 0;

      for (const event of stuckEvents) {
        try {
          await this.reemitEvent(event);
          recovered++;
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to re-emit event ${event.id}:`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      this.logger.log(
        `Sweep complete: ${recovered} recovered, ${failed} failed`,
      );
    } catch (error) {
      this.logger.error('Sweep failed:', error);
    }
  }

  private async reemitEvent(event: EventRecord): Promise<void> {
    // Reconstruct Kafka message from DB record
    // Note: Some fields may be approximated since original Kafka message data
    // might differ from what was stored in DB
    const payload = event.payload as Record<string, unknown>;
    const message: RawEventMessage = {
      projectId: event.projectId,
      userId: event.userId || 'unknown',
      event: event.eventType,
      properties: payload,
      timestamp: (payload.timestamp as string) || event.createdAt.toISOString(),
      receivedAt: (payload.receivedAt as string) || event.createdAt.toISOString(),
    };

    // Re-emit to Kafka
    this.kafkaClient.emit('events.raw', {
      key: event.projectId,
      value: message,
    });

    this.logger.debug(`Re-emitted event ${event.id} to Kafka`);
  }

  /**
   * Stop the sweeper (useful for graceful shutdown)
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Sweeper stopped');
    }
  }
}
