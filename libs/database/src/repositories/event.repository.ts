import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { events, EventStatus } from '../schema';

export interface CreateEventData {
  projectId: string;
  eventType: string;
  userId?: string;
  payload: Record<string, unknown>;
}

export interface EventRecord {
  id: string;
  projectId: string;
  eventType: string;
  userId: string | null;
  payload: unknown;
  status: string;
  errorDetails: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

@Injectable()
export class EventRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateEventData): Promise<{ id: string }> {
    const result = await this.db
      .insert(events)
      .values({
        projectId: data.projectId,
        eventType: data.eventType,
        userId: data.userId,
        payload: data.payload,
        status: 'pending',
      })
      .returning({ id: events.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to insert event');
    }
    return inserted;
  }

  async updateStatus(
    eventId: string,
    status: EventStatus,
    errorDetails?: string,
  ): Promise<void> {
    await this.db
      .update(events)
      .set({
        status,
        errorDetails: errorDetails ?? null,
        processedAt: status === 'processed' ? new Date() : undefined,
      })
      .where(eq(events.id, eventId));
  }

  async markAsProcessed(eventId: string): Promise<void> {
    await this.updateStatus(eventId, 'processed');
  }

  async markAsFailed(eventId: string, errorDetails: string): Promise<void> {
    await this.updateStatus(eventId, 'failed', errorDetails);
  }

  async findById(eventId: string): Promise<EventRecord | null> {
    const result = await this.db.query.events.findFirst({
      where: eq(events.id, eventId),
    });
    return (result as EventRecord) || null;
  }
}
