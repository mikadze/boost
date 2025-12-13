import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  streakRules,
  StreakRule,
  NewStreakRule,
  StreakFrequency,
} from '../schema';

export interface StreakMilestone {
  day: number;
  rewardXp: number;
  badgeId?: string;
}

export interface CreateStreakRuleData {
  projectId: string;
  name: string;
  description?: string;
  eventType: string;
  frequency?: StreakFrequency;
  milestones?: StreakMilestone[];
  defaultFreezeCount?: number;
  active?: boolean;
  timezoneOffsetMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateStreakRuleData {
  name?: string;
  description?: string;
  eventType?: string;
  frequency?: StreakFrequency;
  milestones?: StreakMilestone[];
  defaultFreezeCount?: number;
  active?: boolean;
  timezoneOffsetMinutes?: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class StreakRuleRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateStreakRuleData): Promise<StreakRule> {
    const result = await this.db
      .insert(streakRules)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        eventType: data.eventType,
        frequency: data.frequency ?? 'daily',
        milestones: data.milestones ?? [],
        defaultFreezeCount: data.defaultFreezeCount ?? 0,
        active: data.active ?? true,
        timezoneOffsetMinutes: data.timezoneOffsetMinutes ?? 0,
        metadata: data.metadata,
      })
      .returning();

    const rule = result[0];
    if (!rule) {
      throw new Error('Failed to create streak rule');
    }
    return rule;
  }

  async findById(id: string): Promise<StreakRule | null> {
    const result = await this.db.query.streakRules.findFirst({
      where: eq(streakRules.id, id),
    });
    return result ?? null;
  }

  async findByProjectId(projectId: string): Promise<StreakRule[]> {
    const result = await this.db
      .select()
      .from(streakRules)
      .where(eq(streakRules.projectId, projectId))
      .orderBy(streakRules.createdAt);

    return result;
  }

  async findActiveByProjectId(projectId: string): Promise<StreakRule[]> {
    const result = await this.db
      .select()
      .from(streakRules)
      .where(
        and(
          eq(streakRules.projectId, projectId),
          eq(streakRules.active, true),
        ),
      )
      .orderBy(streakRules.createdAt);

    return result;
  }

  async findByEventType(
    projectId: string,
    eventType: string,
  ): Promise<StreakRule[]> {
    const result = await this.db
      .select()
      .from(streakRules)
      .where(
        and(
          eq(streakRules.projectId, projectId),
          eq(streakRules.eventType, eventType),
          eq(streakRules.active, true),
        ),
      );

    return result;
  }

  async update(id: string, data: UpdateStreakRuleData): Promise<void> {
    await this.db
      .update(streakRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(streakRules.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(streakRules).where(eq(streakRules.id, id));
  }

  /**
   * Get milestones for a streak rule, sorted by day
   */
  getMilestones(rule: StreakRule): StreakMilestone[] {
    const milestones = rule.milestones as StreakMilestone[];
    return [...milestones].sort((a, b) => a.day - b.day);
  }

  /**
   * Get the next milestone for a given streak count
   */
  getNextMilestone(
    rule: StreakRule,
    currentStreak: number,
  ): StreakMilestone | null {
    const milestones = this.getMilestones(rule);
    return milestones.find((m) => m.day > currentStreak) ?? null;
  }

  /**
   * Get milestone that was just reached (if any)
   */
  getReachedMilestone(
    rule: StreakRule,
    newStreak: number,
    previousMilestoneDay: number,
  ): StreakMilestone | null {
    const milestones = this.getMilestones(rule);
    return (
      milestones.find(
        (m) => m.day <= newStreak && m.day > previousMilestoneDay,
      ) ?? null
    );
  }
}
