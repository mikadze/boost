import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError, throwError } from 'rxjs';
import { EventSource } from '@boost/common';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * Kafka message structure for raw events
 * This is the message format sent to the events.raw topic
 */
export interface RawEventKafkaMessage {
  projectId: string;
  userId: string;
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  receivedAt: string;
  /** Event source: 'server' for secret key, 'client' for publishable key */
  _source: EventSource;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) {}

  /**
   * Track an event - Kafka only, no DB writes
   * High-throughput design for <50ms response time
   *
   * @param projectId - Project ID from API key
   * @param dto - Event data
   * @param source - Event source ('server' or 'client') based on API key type
   */
  async trackEvent(
    projectId: string,
    dto: TrackEventDto,
    source: EventSource,
  ): Promise<void> {
    const receivedAt = new Date().toISOString();
    const eventName = dto.getEventName();

    // Build Kafka message
    const message: RawEventKafkaMessage = {
      projectId,
      userId: dto.userId,
      event: eventName,
      properties: dto.getTraits(),
      timestamp: dto.getTimestamp(),
      receivedAt,
      _source: source,
    };

    // Fire-and-forget to Kafka with short timeout
    // The worker will handle persistence and processing
    await lastValueFrom(
      this.kafkaClient
        .emit('events.raw', {
          key: projectId, // Partition key ensures ordering per project
          value: message,
        })
        .pipe(
          timeout(3000), // 3 second timeout for fast failure
          catchError((err) => {
            this.logger.error(`Kafka emit failed:`, err);
            return throwError(() => err);
          }),
        ),
    );

    this.logger.debug(`Event queued for project ${projectId}: ${eventName}`);
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('Kafka client connected');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.log('Kafka client disconnected');
  }
}
