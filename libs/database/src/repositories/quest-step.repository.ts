import { Injectable, Inject } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { questSteps, QuestStep } from '../schema';

export interface CreateQuestStepData {
  questId: string;
  projectId: string;
  eventName: string;
  requiredCount?: number;
  orderIndex?: number;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateQuestStepData {
  eventName?: string;
  requiredCount?: number;
  orderIndex?: number;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class QuestStepRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateQuestStepData): Promise<QuestStep> {
    const result = await this.db
      .insert(questSteps)
      .values({
        questId: data.questId,
        projectId: data.projectId,
        eventName: data.eventName,
        requiredCount: data.requiredCount ?? 1,
        orderIndex: data.orderIndex ?? 0,
        title: data.title,
        description: data.description,
        metadata: data.metadata,
      })
      .returning();

    const step = result[0];
    if (!step) {
      throw new Error('Failed to create quest step');
    }

    return step;
  }

  async createMany(steps: CreateQuestStepData[]): Promise<QuestStep[]> {
    if (steps.length === 0) {
      return [];
    }

    const result = await this.db
      .insert(questSteps)
      .values(
        steps.map((step) => ({
          questId: step.questId,
          projectId: step.projectId,
          eventName: step.eventName,
          requiredCount: step.requiredCount ?? 1,
          orderIndex: step.orderIndex ?? 0,
          title: step.title,
          description: step.description,
          metadata: step.metadata,
        })),
      )
      .returning();

    return result;
  }

  async findById(id: string): Promise<QuestStep | null> {
    const result = await this.db
      .select()
      .from(questSteps)
      .where(eq(questSteps.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByQuestId(questId: string): Promise<QuestStep[]> {
    return await this.db
      .select()
      .from(questSteps)
      .where(eq(questSteps.questId, questId))
      .orderBy(asc(questSteps.orderIndex));
  }

  async findByEventName(projectId: string, eventName: string): Promise<QuestStep[]> {
    return await this.db
      .select()
      .from(questSteps)
      .where(
        and(
          eq(questSteps.projectId, projectId),
          eq(questSteps.eventName, eventName),
        ),
      );
  }

  async update(id: string, data: UpdateQuestStepData): Promise<QuestStep | null> {
    const result = await this.db
      .update(questSteps)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(questSteps.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(questSteps)
      .where(eq(questSteps.id, id))
      .returning({ id: questSteps.id });

    return result.length > 0;
  }

  async deleteByQuestId(questId: string): Promise<number> {
    const result = await this.db
      .delete(questSteps)
      .where(eq(questSteps.questId, questId))
      .returning({ id: questSteps.id });

    return result.length;
  }
}
