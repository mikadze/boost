import { Injectable, Inject } from '@nestjs/common';
import { eq, and, lt, sql, desc } from 'drizzle-orm';
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

  /**
   * Find events stuck in pending status longer than the threshold.
   * Used by the Sweeper job to recover events that failed to emit to Kafka.
   */
  async findStuckPendingEvents(
    olderThanMinutes: number,
    limit: number = 100,
  ): Promise<EventRecord[]> {
    const threshold = new Date(Date.now() - olderThanMinutes * 60 * 1000);

    const result = await this.db
      .select()
      .from(events)
      .where(and(eq(events.status, 'pending'), lt(events.createdAt, threshold)))
      .limit(limit);

    return result as EventRecord[];
  }

  /**
   * Mark an event as ready for retry by resetting its status.
   * Used by the Sweeper to re-queue stuck events.
   */
  async markForRetry(eventId: string): Promise<void> {
    await this.db
      .update(events)
      .set({
        status: 'pending',
        errorDetails: 'Retried by sweeper job',
      })
      .where(eq(events.id, eventId));
  }

  /**
   * Count total events for a project.
   * Used for project stats summary.
   */
  async countByProjectId(projectId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.projectId, projectId));

    return result[0]?.count ?? 0;
  }

  /**
   * Get the first event date for a project.
   * Used for project stats summary.
   */
  async getFirstEventDate(projectId: string): Promise<Date | null> {
    const result = await this.db
      .select({ createdAt: events.createdAt })
      .from(events)
      .where(eq(events.projectId, projectId))
      .orderBy(events.createdAt)
      .limit(1);

    return result[0]?.createdAt ?? null;
  }

  /**
   * Get recent events for a project.
   * Used for setup guide verification.
   */
  async findRecentByProjectId(
    projectId: string,
    limit: number = 10,
  ): Promise<EventRecord[]> {
    const result = await this.db
      .select()
      .from(events)
      .where(eq(events.projectId, projectId))
      .orderBy(desc(events.createdAt))
      .limit(limit);

    return result as EventRecord[];
  }
}
