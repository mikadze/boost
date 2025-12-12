import {
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom, timeout, catchError } from 'rxjs';
import { EventRepository } from '@boost/database';
import { RawEventMessage } from '@boost/common';
import { CreateEventDto } from '../dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
    private readonly eventRepository: EventRepository,
  ) {}

  async createEvent(projectId: string, createEventDto: CreateEventDto) {
    // Store event in database first via repository
    const { id: eventId } = await this.eventRepository.create({
      projectId,
      eventType: createEventDto.eventType,
      userId: createEventDto.userId,
      payload: createEventDto.payload,
    });

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
        this.kafkaClient
          .emit('events.raw', {
            key: projectId,
            value: kafkaMessage,
          })
          .pipe(
            timeout(5000), // 5 second timeout for Kafka
            catchError((err) => {
              this.logger.error(`Kafka emit failed for event ${eventId}:`, err);
              throw err;
            }),
          ),
      );
    } catch (error) {
      // Mark event as failed if Kafka emit fails
      await this.eventRepository.markAsFailed(
        eventId,
        `Kafka emit failed: ${error instanceof Error ? error.message : String(error)}`,
      );

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
