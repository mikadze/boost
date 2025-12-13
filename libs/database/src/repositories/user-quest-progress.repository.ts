import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  userQuestProgress,
  userStepProgress,
  questDefinitions,
  questSteps,
  UserQuestProgress,
  UserStepProgress,
  QuestDefinition,
  QuestStep,
  QuestProgressStatus,
} from '../schema';

export interface CreateUserQuestProgressData {
  projectId: string;
  endUserId: string;
  questId: string;
  status?: QuestProgressStatus;
  percentComplete?: number;
  startedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateUserQuestProgressData {
  status?: QuestProgressStatus;
  percentComplete?: number;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface UserQuestProgressWithDetails extends UserQuestProgress {
  quest: QuestDefinition;
  stepProgress: (UserStepProgress & { step: QuestStep })[];
}

@Injectable()
export class UserQuestProgressRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateUserQuestProgressData): Promise<UserQuestProgress> {
    const result = await this.db
      .insert(userQuestProgress)
      .values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        questId: data.questId,
        status: data.status ?? 'not_started',
        percentComplete: data.percentComplete ?? 0,
        startedAt: data.startedAt,
        metadata: data.metadata,
      })
      .returning();

    const progress = result[0];
    if (!progress) {
      throw new Error('Failed to create user quest progress');
    }

    return progress;
  }

  async findById(id: string): Promise<UserQuestProgress | null> {
    const result = await this.db
      .select()
      .from(userQuestProgress)
      .where(eq(userQuestProgress.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByUserAndQuest(endUserId: string, questId: string): Promise<UserQuestProgress | null> {
    const result = await this.db
      .select()
      .from(userQuestProgress)
      .where(
        and(
          eq(userQuestProgress.endUserId, endUserId),
          eq(userQuestProgress.questId, questId),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findByEndUserId(endUserId: string): Promise<UserQuestProgress[]> {
    return await this.db
      .select()
      .from(userQuestProgress)
      .where(eq(userQuestProgress.endUserId, endUserId))
      .orderBy(desc(userQuestProgress.updatedAt));
  }

  async findByEndUserIdWithDetails(endUserId: string): Promise<UserQuestProgressWithDetails[]> {
    const progressList = await this.findByEndUserId(endUserId);

    const result: UserQuestProgressWithDetails[] = [];

    for (const progress of progressList) {
      // Get quest definition
      const questResult = await this.db
        .select()
        .from(questDefinitions)
        .where(eq(questDefinitions.id, progress.questId))
        .limit(1);

      const quest = questResult[0];
      if (!quest) continue;

      // Get step progress with step details
      const stepProgressList = await this.db
        .select()
        .from(userStepProgress)
        .where(eq(userStepProgress.userQuestProgressId, progress.id));

      const stepProgressWithDetails: (UserStepProgress & { step: QuestStep })[] = [];

      for (const sp of stepProgressList) {
        const stepResult = await this.db
          .select()
          .from(questSteps)
          .where(eq(questSteps.id, sp.stepId))
          .limit(1);

        const step = stepResult[0];
        if (step) {
          stepProgressWithDetails.push({
            ...sp,
            step,
          });
        }
      }

      // Sort step progress by order index
      stepProgressWithDetails.sort((a, b) => a.step.orderIndex - b.step.orderIndex);

      result.push({
        ...progress,
        quest,
        stepProgress: stepProgressWithDetails,
      });
    }

    return result;
  }

  async findOrCreate(
    projectId: string,
    endUserId: string,
    questId: string,
  ): Promise<UserQuestProgress> {
    const existing = await this.findByUserAndQuest(endUserId, questId);
    if (existing) {
      return existing;
    }

    return this.create({
      projectId,
      endUserId,
      questId,
      status: 'not_started',
      percentComplete: 0,
    });
  }

  async update(id: string, data: UpdateUserQuestProgressData): Promise<UserQuestProgress | null> {
    const result = await this.db
      .update(userQuestProgress)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userQuestProgress.id, id))
      .returning();

    return result[0] ?? null;
  }

  async markInProgress(id: string): Promise<UserQuestProgress | null> {
    return this.update(id, {
      status: 'in_progress',
      startedAt: new Date(),
    });
  }

  async markCompleted(id: string): Promise<UserQuestProgress | null> {
    return this.update(id, {
      status: 'completed',
      percentComplete: 100,
      completedAt: new Date(),
    });
  }

  async updatePercentComplete(id: string, percentComplete: number): Promise<UserQuestProgress | null> {
    return this.update(id, { percentComplete });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(userQuestProgress)
      .where(eq(userQuestProgress.id, id))
      .returning({ id: userQuestProgress.id });

    return result.length > 0;
  }
}
