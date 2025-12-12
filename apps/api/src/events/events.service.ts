import {
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError } from 'rxjs';
import { getDrizzleClient, events } from '@boost/database';
import { RawEventMessage } from '@boost/common';
import { eq } from 'drizzle-orm';
import { CreateEventDto } from '../dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) {}

  async createEvent(projectId: string, createEventDto: CreateEventDto) {
    const db = getDrizzleClient();

    // Store event in database first
    const result = await db
      .insert(events)
      .values({
        projectId,
        eventType: createEventDto.eventType,
        userId: createEventDto.userId,
        payload: createEventDto.payload,
        status: 'pending',
      })
      .returning({ id: events.id });

    const inserted = result[0];
    if (!inserted) {
      throw new InternalServerErrorException('Failed to create event');
    }
    const eventId = inserted.id;

    // Build typed Kafka message
    const kafkaMessage: RawEventMessage = {
      id: eventId,
      projectId,
      eventType: createEventDto.eventType,
      userId: createEventDto.userId,
      payload: createEventDto.payload,
    };

    try {
      // Send to Kafka with projectId as key for ordering
      // Await the emit to ensure message is sent before returning success
      await lastValueFrom(
        this.kafkaClient.emit('events.raw', {
          key: projectId,
          value: kafkaMessage,
        }).pipe(
          timeout(5000), // 5 second timeout for Kafka
          catchError((err) => {
            this.logger.error(`Kafka emit failed for event ${eventId}:`, err);
            throw err;
          }),
        ),
      );
    } catch (error) {
      // Mark event as failed if Kafka emit fails
      await db
        .update(events)
        .set({
          status: 'failed',
          errorDetails: `Kafka emit failed: ${error instanceof Error ? error.message : String(error)}`,
        })
        .where(eq(events.id, eventId));

      throw new InternalServerErrorException(
        'Failed to queue event for processing',
      );
    }

    return { id: eventId };
  }

  async onModuleInit() {
    // Wait for Kafka client to be ready
    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }
}
