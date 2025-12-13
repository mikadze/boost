import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, lt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  userStreaks,
  UserStreak,
  StreakStatus,
  streakRules,
} from '../schema';

export interface CreateUserStreakData {
  projectId: string;
  endUserId: string;
  streakRuleId: string;
  freezeInventory?: number;
}

export interface UserStreakWithRule extends UserStreak {
  streakRule?: typeof streakRules.$inferSelect;
}

/**
 * Result of processing a streak activity
 */
export interface StreakProcessResult {
  previousCount: number;
  newCount: number;
  action: 'started' | 'extended' | 'same_day' | 'broken' | 'frozen';
  milestoneReached?: number;
  freezeUsed: boolean;
  maxStreakUpdated: boolean;
}

@Injectable()
export class UserStreakRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateUserStreakData): Promise<UserStreak> {
    const result = await this.db
      .insert(userStreaks)
      .values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        streakRuleId: data.streakRuleId,
        freezeInventory: data.freezeInventory ?? 0,
        currentCount: 0,
        maxStreak: 0,
        status: 'inactive',
      })
      .returning();

    const streak = result[0];
    if (!streak) {
      throw new Error('Failed to create user streak');
    }
    return streak;
  }

  async findById(id: string): Promise<UserStreak | null> {
    const result = await this.db.query.userStreaks.findFirst({
      where: eq(userStreaks.id, id),
    });
    return result ?? null;
  }

  async findByIdWithRule(id: string): Promise<UserStreakWithRule | null> {
    const result = await this.db.query.userStreaks.findFirst({
      where: eq(userStreaks.id, id),
      with: {
        streakRule: true,
      },
    });
    return result ?? null;
  }

  async findByUserAndRule(
    endUserId: string,
    streakRuleId: string,
  ): Promise<UserStreak | null> {
    const result = await this.db.query.userStreaks.findFirst({
      where: and(
        eq(userStreaks.endUserId, endUserId),
        eq(userStreaks.streakRuleId, streakRuleId),
      ),
    });
    return result ?? null;
  }

  async findOrCreate(
    projectId: string,
    endUserId: string,
    streakRuleId: string,
    defaultFreezeCount: number = 0,
  ): Promise<UserStreak> {
    let streak = await this.findByUserAndRule(endUserId, streakRuleId);

    if (!streak) {
      streak = await this.create({
        projectId,
        endUserId,
        streakRuleId,
        freezeInventory: defaultFreezeCount,
      });
    }

    return streak;
  }

  async findByEndUserId(endUserId: string): Promise<UserStreak[]> {
    const result = await this.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.endUserId, endUserId))
      .orderBy(userStreaks.createdAt);

    return result;
  }

  async findByEndUserIdWithRules(
    endUserId: string,
  ): Promise<UserStreakWithRule[]> {
    const result = await this.db.query.userStreaks.findMany({
      where: eq(userStreaks.endUserId, endUserId),
      with: {
        streakRule: true,
      },
      orderBy: userStreaks.createdAt,
    });
    return result;
  }

  async findByProjectId(projectId: string): Promise<UserStreak[]> {
    const result = await this.db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.projectId, projectId))
      .orderBy(userStreaks.createdAt);

    return result;
  }

  /**
   * Process a streak activity event (Story 2.2 logic)
   * Implements the core streak processing logic:
   * - If activity matches today's date: no action
   * - If activity matches yesterday: increment counter
   * - If older: trigger reset mechanics (freeze or break)
   */
  async processActivity(
    streakId: string,
    activityDate: Date,
    timezoneOffsetMinutes: number = 0,
  ): Promise<StreakProcessResult> {
    const streak = await this.findById(streakId);
    if (!streak) {
      throw new Error('User streak not found');
    }

    // Calculate dates with timezone offset
    const offsetMs = timezoneOffsetMinutes * 60 * 1000;
    const activityDay = this.getDateOnly(
      new Date(activityDate.getTime() + offsetMs),
    );
    const today = this.getDateOnly(new Date(Date.now() + offsetMs));

    const previousCount = streak.currentCount;
    let action: StreakProcessResult['action'];
    let newCount = previousCount;
    let freezeUsed = false;
    let maxStreakUpdated = false;

    // Calculate last activity day (if exists)
    const lastActivityDay = streak.lastActivityDate
      ? this.getDateOnly(
          new Date(streak.lastActivityDate.getTime() + offsetMs),
        )
      : null;

    // Check if activity is for today
    if (this.isSameDay(activityDay, today)) {
      if (lastActivityDay && this.isSameDay(lastActivityDay, today)) {
        // Already logged today - no change
        action = 'same_day';
      } else if (lastActivityDay && this.isYesterday(lastActivityDay, today)) {
        // Yesterday's streak continues - extend
        newCount = previousCount + 1;
        action = 'extended';
      } else if (previousCount === 0) {
        // Starting a new streak
        newCount = 1;
        action = 'started';
      } else {
        // Gap in streak - check freeze
        const result = this.handleStreakGap(streak, today);
        action = result.action;
        freezeUsed = result.freezeUsed;
        newCount = result.newCount;
      }
    } else {
      // Activity is not for today - ignore (future dates) or process as historical
      action = 'same_day';
    }

    // Update max streak if needed
    if (newCount > streak.maxStreak) {
      maxStreakUpdated = true;
    }

    // Determine new status
    const newStatus = this.calculateStatus(newCount, action);

    // Update streak in database
    if (action !== 'same_day') {
      await this.db
        .update(userStreaks)
        .set({
          currentCount: newCount,
          maxStreak: maxStreakUpdated ? newCount : streak.maxStreak,
          lastActivityDate: action !== 'broken' ? today : streak.lastActivityDate,
          freezeInventory: freezeUsed
            ? streak.freezeInventory - 1
            : streak.freezeInventory,
          freezeUsedToday: freezeUsed,
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.id, streakId));
    }

    return {
      previousCount,
      newCount,
      action,
      freezeUsed,
      maxStreakUpdated,
    };
  }

  /**
   * Handle a gap in the streak (Story 2.5)
   * Uses freeze if available, otherwise breaks the streak
   */
  private handleStreakGap(
    streak: UserStreak,
    today: Date,
  ): { action: 'frozen' | 'broken' | 'extended'; newCount: number; freezeUsed: boolean } {
    if (streak.freezeInventory > 0 && !streak.freezeUsedToday) {
      // Use a freeze to protect the streak
      return {
        action: 'frozen',
        newCount: streak.currentCount, // Keep current count
        freezeUsed: true,
      };
    } else {
      // Break the streak - restart at 1
      return {
        action: 'broken',
        newCount: 1,
        freezeUsed: false,
      };
    }
  }

  /**
   * Calculate status based on streak count and action
   */
  private calculateStatus(
    count: number,
    action: StreakProcessResult['action'],
  ): StreakStatus {
    if (count === 0) return 'inactive';
    if (action === 'frozen') return 'frozen';
    if (action === 'broken') return 'active'; // Restarted
    return 'active';
  }

  /**
   * Add freeze tokens to a user's streak
   */
  async addFreezeTokens(streakId: string, count: number): Promise<void> {
    await this.db
      .update(userStreaks)
      .set({
        freezeInventory: sql`${userStreaks.freezeInventory} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.id, streakId));
  }

  /**
   * Update the last milestone day reached
   */
  async updateLastMilestoneDay(
    streakId: string,
    milestoneDay: number,
  ): Promise<void> {
    await this.db
      .update(userStreaks)
      .set({
        lastMilestoneDay: milestoneDay,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.id, streakId));
  }

  /**
   * Find users at risk of losing their streak (for notifications)
   * Returns users who haven't logged activity today
   */
  async findAtRiskStreaks(
    projectId: string,
    timezoneOffsetMinutes: number = 0,
  ): Promise<UserStreak[]> {
    const offsetMs = timezoneOffsetMinutes * 60 * 1000;
    const today = this.getDateOnly(new Date(Date.now() + offsetMs));
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Find active streaks where last activity was yesterday (at risk today)
    const result = await this.db
      .select()
      .from(userStreaks)
      .where(
        and(
          eq(userStreaks.projectId, projectId),
          eq(userStreaks.status, 'active'),
          lt(userStreaks.lastActivityDate, today),
        ),
      );

    return result;
  }

  /**
   * Reset daily freeze flags (should be called at midnight)
   */
  async resetDailyFreezeFlags(projectId: string): Promise<void> {
    await this.db
      .update(userStreaks)
      .set({
        freezeUsedToday: false,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.projectId, projectId));
  }

  /**
   * Update status (for manual status changes or notifications)
   */
  async updateStatus(streakId: string, status: StreakStatus): Promise<void> {
    await this.db
      .update(userStreaks)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.id, streakId));
  }

  /**
   * Break a streak (reset to 0)
   */
  async breakStreak(streakId: string): Promise<void> {
    await this.db
      .update(userStreaks)
      .set({
        currentCount: 0,
        status: 'broken',
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.id, streakId));
  }

  /**
   * Delete a user streak
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(userStreaks).where(eq(userStreaks.id, id));
  }

  // Date utility methods
  private getDateOnly(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private isYesterday(date: Date, today: Date): boolean {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(date, yesterday);
  }
}
