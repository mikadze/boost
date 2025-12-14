import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  userBadges,
  badgeDefinitions,
  UserBadge,
  BadgeDefinition,
  BadgeAwardSource,
} from '../schema';

export interface CreateUserBadgeData {
  projectId: string;
  endUserId: string;
  badgeId: string;
  metadata?: Record<string, unknown>;
  awardSource?: BadgeAwardSource;
  awardedBy?: string;
}

export interface UserBadgeWithDetails extends UserBadge {
  badge: BadgeDefinition;
}

@Injectable()
export class UserBadgeRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Award a badge to a user. Returns null if badge already awarded (idempotent).
   */
  async awardBadge(data: CreateUserBadgeData): Promise<UserBadge | null> {
    // Check if badge already awarded (idempotent)
    const existing = await this.findByUserAndBadge(data.endUserId, data.badgeId);
    if (existing) {
      return null; // Already has badge, return null to indicate no new award
    }

    const result = await this.db
      .insert(userBadges)
      .values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        badgeId: data.badgeId,
        metadata: data.metadata,
        awardSource: data.awardSource ?? 'AUTOMATIC',
        awardedBy: data.awardedBy,
        unlockedAt: new Date(),
      })
      .returning();

    const badge = result[0];
    if (!badge) {
      throw new Error('Failed to award badge');
    }

    return badge;
  }

  async findById(id: string): Promise<UserBadge | null> {
    const result = await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByUserAndBadge(endUserId: string, badgeId: string): Promise<UserBadge | null> {
    const result = await this.db
      .select()
      .from(userBadges)
      .where(
        and(
          eq(userBadges.endUserId, endUserId),
          eq(userBadges.badgeId, badgeId),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async hasBadge(endUserId: string, badgeId: string): Promise<boolean> {
    const badge = await this.findByUserAndBadge(endUserId, badgeId);
    return badge !== null;
  }

  async findByEndUserId(endUserId: string): Promise<UserBadge[]> {
    return await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.endUserId, endUserId))
      .orderBy(desc(userBadges.unlockedAt));
  }

  async findByEndUserIdWithDetails(endUserId: string): Promise<UserBadgeWithDetails[]> {
    const badges = await this.findByEndUserId(endUserId);

    if (badges.length === 0) {
      return [];
    }

    const badgeIds = badges.map((b) => b.badgeId);
    const badgeDefinitionsList = await this.db
      .select()
      .from(badgeDefinitions)
      .where(inArray(badgeDefinitions.id, badgeIds));

    const badgeMap = new Map(badgeDefinitionsList.map((b) => [b.id, b]));

    return badges
      .map((ub) => {
        const badge = badgeMap.get(ub.badgeId);
        if (!badge) return null;
        return {
          ...ub,
          badge,
        };
      })
      .filter((b): b is UserBadgeWithDetails => b !== null);
  }

  async findByProjectId(projectId: string): Promise<UserBadge[]> {
    return await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.projectId, projectId))
      .orderBy(desc(userBadges.unlockedAt));
  }

  async countByBadge(badgeId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.badgeId, badgeId));

    return result.length;
  }

  async countByEndUser(endUserId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.endUserId, endUserId));

    return result.length;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(userBadges)
      .where(eq(userBadges.id, id))
      .returning({ id: userBadges.id });

    return result.length > 0;
  }

  async deleteByUserAndBadge(endUserId: string, badgeId: string): Promise<boolean> {
    const result = await this.db
      .delete(userBadges)
      .where(
        and(
          eq(userBadges.endUserId, endUserId),
          eq(userBadges.badgeId, badgeId),
        ),
      )
      .returning({ id: userBadges.id });

    return result.length > 0;
  }

  /**
   * Get recently awarded badges for a project (for admin dashboard)
   */
  async getRecentAwards(projectId: string, limit: number = 10): Promise<UserBadgeWithDetails[]> {
    const badges = await this.db
      .select()
      .from(userBadges)
      .where(eq(userBadges.projectId, projectId))
      .orderBy(desc(userBadges.unlockedAt))
      .limit(limit);

    if (badges.length === 0) {
      return [];
    }

    const badgeIds = badges.map((b) => b.badgeId);
    const badgeDefinitionsList = await this.db
      .select()
      .from(badgeDefinitions)
      .where(inArray(badgeDefinitions.id, badgeIds));

    const badgeMap = new Map(badgeDefinitionsList.map((b) => [b.id, b]));

    return badges
      .map((ub) => {
        const badge = badgeMap.get(ub.badgeId);
        if (!badge) return null;
        return {
          ...ub,
          badge,
        };
      })
      .filter((b): b is UserBadgeWithDetails => b !== null);
  }
}
