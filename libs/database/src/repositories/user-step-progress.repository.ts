import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { userStepProgress, UserStepProgress } from '../schema';

export interface CreateUserStepProgressData {
  projectId: string;
  endUserId: string;
  stepId: string;
  userQuestProgressId: string;
  currentCount?: number;
  isComplete?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateUserStepProgressData {
  currentCount?: number;
  isComplete?: boolean;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class UserStepProgressRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateUserStepProgressData): Promise<UserStepProgress> {
    const result = await this.db
      .insert(userStepProgress)
      .values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        stepId: data.stepId,
        userQuestProgressId: data.userQuestProgressId,
        currentCount: data.currentCount ?? 0,
        isComplete: data.isComplete ?? false,
        metadata: data.metadata,
      })
      .returning();

    const progress = result[0];
    if (!progress) {
      throw new Error('Failed to create user step progress');
    }

    return progress;
  }

  async findById(id: string): Promise<UserStepProgress | null> {
    const result = await this.db
      .select()
      .from(userStepProgress)
      .where(eq(userStepProgress.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByUserAndStep(endUserId: string, stepId: string): Promise<UserStepProgress | null> {
    const result = await this.db
      .select()
      .from(userStepProgress)
      .where(
        and(
          eq(userStepProgress.endUserId, endUserId),
          eq(userStepProgress.stepId, stepId),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findByQuestProgressId(userQuestProgressId: string): Promise<UserStepProgress[]> {
    return await this.db
      .select()
      .from(userStepProgress)
      .where(eq(userStepProgress.userQuestProgressId, userQuestProgressId));
  }

  async findOrCreate(
    projectId: string,
    endUserId: string,
    stepId: string,
    userQuestProgressId: string,
  ): Promise<UserStepProgress> {
    const existing = await this.findByUserAndStep(endUserId, stepId);
    if (existing) {
      return existing;
    }

    return this.create({
      projectId,
      endUserId,
      stepId,
      userQuestProgressId,
      currentCount: 0,
      isComplete: false,
    });
  }

  async update(id: string, data: UpdateUserStepProgressData): Promise<UserStepProgress | null> {
    const result = await this.db
      .update(userStepProgress)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userStepProgress.id, id))
      .returning();

    return result[0] ?? null;
  }

  async incrementCount(id: string, increment: number = 1): Promise<UserStepProgress | null> {
    const current = await this.findById(id);
    if (!current) {
      return null;
    }

    return this.update(id, {
      currentCount: current.currentCount + increment,
    });
  }

  async markComplete(id: string): Promise<UserStepProgress | null> {
    return this.update(id, {
      isComplete: true,
      completedAt: new Date(),
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(userStepProgress)
      .where(eq(userStepProgress.id, id))
      .returning({ id: userStepProgress.id });

    return result.length > 0;
  }

  async deleteByQuestProgressId(userQuestProgressId: string): Promise<number> {
    const result = await this.db
      .delete(userStepProgress)
      .where(eq(userStepProgress.userQuestProgressId, userQuestProgressId))
      .returning({ id: userStepProgress.id });

    return result.length;
  }
}
