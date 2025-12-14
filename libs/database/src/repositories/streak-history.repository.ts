import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  streakHistory,
  StreakHistoryEntry,
  StreakAction,
} from '../schema';

export interface CreateStreakHistoryData {
  projectId: string;
  endUserId: string;
  streakRuleId: string;
  userStreakId: string;
  action: StreakAction;
  streakCount: number;
  milestoneDay?: number;
  xpAwarded?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class StreakHistoryRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateStreakHistoryData): Promise<StreakHistoryEntry> {
    const result = await this.db
      .insert(streakHistory)
      .values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        streakRuleId: data.streakRuleId,
        userStreakId: data.userStreakId,
        action: data.action,
        streakCount: data.streakCount,
        milestoneDay: data.milestoneDay,
        xpAwarded: data.xpAwarded,
        metadata: data.metadata,
      })
      .returning();

    const entry = result[0];
    if (!entry) {
      throw new Error('Failed to create streak history entry');
    }
    return entry;
  }

  async findByUserStreakId(
    userStreakId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<StreakHistoryEntry[]> {
    const result = await this.db
      .select()
      .from(streakHistory)
      .where(eq(streakHistory.userStreakId, userStreakId))
      .orderBy(desc(streakHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findByEndUserId(
    endUserId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<StreakHistoryEntry[]> {
    const result = await this.db
      .select()
      .from(streakHistory)
      .where(eq(streakHistory.endUserId, endUserId))
      .orderBy(desc(streakHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findByProjectId(
    projectId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<StreakHistoryEntry[]> {
    const result = await this.db
      .select()
      .from(streakHistory)
      .where(eq(streakHistory.projectId, projectId))
      .orderBy(desc(streakHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findByAction(
    projectId: string,
    action: StreakAction,
    limit: number = 50,
  ): Promise<StreakHistoryEntry[]> {
    const result = await this.db
      .select()
      .from(streakHistory)
      .where(
        and(
          eq(streakHistory.projectId, projectId),
          eq(streakHistory.action, action),
        ),
      )
      .orderBy(desc(streakHistory.createdAt))
      .limit(limit);

    return result;
  }

  async findMilestonesByUser(
    endUserId: string,
    streakRuleId?: string,
  ): Promise<StreakHistoryEntry[]> {
    const conditions = [
      eq(streakHistory.endUserId, endUserId),
      eq(streakHistory.action, 'milestone_reached'),
    ];

    if (streakRuleId) {
      conditions.push(eq(streakHistory.streakRuleId, streakRuleId));
    }

    const result = await this.db
      .select()
      .from(streakHistory)
      .where(and(...conditions))
      .orderBy(desc(streakHistory.createdAt));

    return result;
  }

  /**
   * Record a streak extension
   */
  async recordExtension(
    data: Omit<CreateStreakHistoryData, 'action'>,
  ): Promise<StreakHistoryEntry> {
    return this.create({ ...data, action: 'extended' });
  }

  /**
   * Record a streak being broken
   */
  async recordBroken(
    data: Omit<CreateStreakHistoryData, 'action'>,
  ): Promise<StreakHistoryEntry> {
    return this.create({ ...data, action: 'broken' });
  }

  /**
   * Record a streak being frozen (protected)
   */
  async recordFrozen(
    data: Omit<CreateStreakHistoryData, 'action'>,
  ): Promise<StreakHistoryEntry> {
    return this.create({ ...data, action: 'frozen' });
  }

  /**
   * Record a milestone being reached
   */
  async recordMilestone(
    data: Omit<CreateStreakHistoryData, 'action'> & {
      milestoneDay: number;
      xpAwarded?: number;
    },
  ): Promise<StreakHistoryEntry> {
    return this.create({ ...data, action: 'milestone_reached' });
  }

  /**
   * Record a streak being started
   */
  async recordStarted(
    data: Omit<CreateStreakHistoryData, 'action'>,
  ): Promise<StreakHistoryEntry> {
    return this.create({ ...data, action: 'started' });
  }
}
