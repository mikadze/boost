import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  questDefinitions,
  questSteps,
  QuestDefinition,
  QuestStep,
} from '../schema';

export interface CreateQuestDefinitionData {
  projectId: string;
  name: string;
  description?: string;
  rewardXp?: number;
  rewardBadgeId?: string;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateQuestDefinitionData {
  name?: string;
  description?: string;
  rewardXp?: number;
  rewardBadgeId?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface QuestDefinitionWithSteps extends QuestDefinition {
  steps: QuestStep[];
}

@Injectable()
export class QuestDefinitionRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateQuestDefinitionData): Promise<QuestDefinition> {
    const result = await this.db
      .insert(questDefinitions)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        rewardXp: data.rewardXp ?? 0,
        rewardBadgeId: data.rewardBadgeId,
        active: data.active ?? false,
        metadata: data.metadata,
      })
      .returning();

    const quest = result[0];
    if (!quest) {
      throw new Error('Failed to create quest definition');
    }

    return quest;
  }

  async findById(id: string): Promise<QuestDefinition | null> {
    const result = await this.db
      .select()
      .from(questDefinitions)
      .where(eq(questDefinitions.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByIdWithSteps(id: string): Promise<QuestDefinitionWithSteps | null> {
    const quest = await this.findById(id);
    if (!quest) {
      return null;
    }

    const steps = await this.db
      .select()
      .from(questSteps)
      .where(eq(questSteps.questId, id))
      .orderBy(questSteps.orderIndex);

    return {
      ...quest,
      steps,
    };
  }

  async findByProjectId(projectId: string): Promise<QuestDefinition[]> {
    return await this.db
      .select()
      .from(questDefinitions)
      .where(eq(questDefinitions.projectId, projectId))
      .orderBy(desc(questDefinitions.createdAt));
  }

  async findActiveByProjectId(projectId: string): Promise<QuestDefinition[]> {
    return await this.db
      .select()
      .from(questDefinitions)
      .where(
        and(
          eq(questDefinitions.projectId, projectId),
          eq(questDefinitions.active, true),
        ),
      )
      .orderBy(desc(questDefinitions.createdAt));
  }

  async findByProjectIdWithSteps(projectId: string): Promise<QuestDefinitionWithSteps[]> {
    const quests = await this.findByProjectId(projectId);

    const questsWithSteps: QuestDefinitionWithSteps[] = [];
    for (const quest of quests) {
      const steps = await this.db
        .select()
        .from(questSteps)
        .where(eq(questSteps.questId, quest.id))
        .orderBy(questSteps.orderIndex);

      questsWithSteps.push({
        ...quest,
        steps,
      });
    }

    return questsWithSteps;
  }

  async update(id: string, data: UpdateQuestDefinitionData): Promise<QuestDefinition | null> {
    const result = await this.db
      .update(questDefinitions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(questDefinitions.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(questDefinitions)
      .where(eq(questDefinitions.id, id))
      .returning({ id: questDefinitions.id });

    return result.length > 0;
  }

  async publish(id: string): Promise<QuestDefinition | null> {
    return this.update(id, { active: true });
  }

  async unpublish(id: string): Promise<QuestDefinition | null> {
    return this.update(id, { active: false });
  }
}
