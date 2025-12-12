import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { getDrizzleClient, events } from '@boost/database';
import { CreateEventDto } from '../dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientKafka,
  ) {}

  async createEvent(projectId: string, createEventDto: CreateEventDto) {
    const db = getDrizzleClient();

    // Store event in database
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

    // Send to Kafka with projectId as key for ordering
    this.kafkaClient.emit('events.raw', {
      key: projectId,
      value: {
        id: result[0].id,
        projectId,
        ...createEventDto,
      },
    });

    return result[0];
  }

  async onModuleInit() {
    // Wait for Kafka client to be ready
    await this.kafkaClient.connect();
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
  }
}
