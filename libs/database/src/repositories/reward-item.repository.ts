import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, asc, sql, isNull, gt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  rewardItems,
  RewardItem,
  RewardFulfillmentType,
} from '../schema';

export interface CreateRewardItemData {
  projectId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  costPoints: number;
  stockQuantity?: number | null;
  prerequisiteBadgeId?: string;
  fulfillmentType: RewardFulfillmentType;
  fulfillmentConfig?: Record<string, unknown>;
  active?: boolean;
  displayOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateRewardItemData {
  name?: string;
  description?: string;
  imageUrl?: string;
  sku?: string;
  costPoints?: number;
  stockQuantity?: number | null;
  prerequisiteBadgeId?: string | null;
  fulfillmentType?: RewardFulfillmentType;
  fulfillmentConfig?: Record<string, unknown>;
  active?: boolean;
  displayOrder?: number;
  metadata?: Record<string, unknown>;
}

export interface RewardItemAvailability {
  available: boolean;
  reason?: 'out_of_stock' | 'insufficient_points' | 'missing_badge' | 'inactive';
  pointsNeeded?: number;
  requiredBadgeId?: string;
}

@Injectable()
export class RewardItemRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateRewardItemData): Promise<{ id: string }> {
    const result = await this.db
      .insert(rewardItems)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        sku: data.sku,
        costPoints: data.costPoints,
        stockQuantity: data.stockQuantity,
        prerequisiteBadgeId: data.prerequisiteBadgeId,
        fulfillmentType: data.fulfillmentType,
        fulfillmentConfig: data.fulfillmentConfig ?? {},
        active: data.active ?? true,
        displayOrder: data.displayOrder ?? 0,
        metadata: data.metadata,
      })
      .returning({ id: rewardItems.id });

    const item = result[0];
    if (!item) {
      throw new Error('Failed to create reward item');
    }
    return item;
  }

  async findById(id: string): Promise<RewardItem | null> {
    const result = await this.db.query.rewardItems.findFirst({
      where: eq(rewardItems.id, id),
    });
    return result ?? null;
  }

  async findByProjectId(
    projectId: string,
    options: { activeOnly?: boolean; limit?: number; offset?: number } = {},
  ): Promise<RewardItem[]> {
    const { activeOnly = false, limit = 100, offset = 0 } = options;

    const conditions = [eq(rewardItems.projectId, projectId)];
    if (activeOnly) {
      conditions.push(eq(rewardItems.active, true));
    }

    const result = await this.db
      .select()
      .from(rewardItems)
      .where(and(...conditions))
      .orderBy(asc(rewardItems.displayOrder), desc(rewardItems.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findBySku(projectId: string, sku: string): Promise<RewardItem | null> {
    const result = await this.db.query.rewardItems.findFirst({
      where: and(
        eq(rewardItems.projectId, projectId),
        eq(rewardItems.sku, sku),
      ),
    });
    return result ?? null;
  }

  async findAvailableItems(projectId: string): Promise<RewardItem[]> {
    const result = await this.db
      .select()
      .from(rewardItems)
      .where(
        and(
          eq(rewardItems.projectId, projectId),
          eq(rewardItems.active, true),
          // Only items with stock or unlimited stock
          sql`(${rewardItems.stockQuantity} IS NULL OR ${rewardItems.stockQuantity} > 0)`,
        ),
      )
      .orderBy(asc(rewardItems.displayOrder), desc(rewardItems.createdAt));

    return result;
  }

  async update(id: string, data: UpdateRewardItemData): Promise<void> {
    await this.db
      .update(rewardItems)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(rewardItems.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(rewardItems).where(eq(rewardItems.id, id));
  }

  async decrementStock(id: string): Promise<boolean> {
    // Atomic stock decrement with check
    const result = await this.db
      .update(rewardItems)
      .set({
        stockQuantity: sql`${rewardItems.stockQuantity} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(rewardItems.id, id),
          gt(rewardItems.stockQuantity, 0),
        ),
      )
      .returning({ id: rewardItems.id });

    return result.length > 0;
  }

  async checkAvailability(
    item: RewardItem,
    userPoints: number,
    userBadges: string[] = [],
  ): Promise<RewardItemAvailability> {
    // Check if item is active
    if (!item.active) {
      return { available: false, reason: 'inactive' };
    }

    // Check stock
    if (item.stockQuantity !== null && item.stockQuantity <= 0) {
      return { available: false, reason: 'out_of_stock' };
    }

    // Check points
    if (userPoints < item.costPoints) {
      return {
        available: false,
        reason: 'insufficient_points',
        pointsNeeded: item.costPoints - userPoints,
      };
    }

    // Check badge requirement
    if (item.prerequisiteBadgeId && !userBadges.includes(item.prerequisiteBadgeId)) {
      return {
        available: false,
        reason: 'missing_badge',
        requiredBadgeId: item.prerequisiteBadgeId,
      };
    }

    return { available: true };
  }
}
