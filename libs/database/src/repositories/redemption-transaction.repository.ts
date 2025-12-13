import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, lt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  redemptionTransactions,
  rewardItems,
  endUsers,
  loyaltyLedger,
  RedemptionTransaction,
  RedemptionStatus,
} from '../schema';

export interface CreateRedemptionData {
  projectId: string;
  endUserId: string;
  rewardItemId: string;
  costAtTime: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateRedemptionData {
  status?: RedemptionStatus;
  errorMessage?: string | null;
  fulfillmentData?: Record<string, unknown>;
  webhookRetries?: number;
  fulfilledAt?: Date | null;
}

export interface RedemptionWithDetails extends RedemptionTransaction {
  rewardItem: {
    id: string;
    name: string;
    sku: string | null;
    fulfillmentType: string;
  };
}

export interface AtomicRedemptionResult {
  success: boolean;
  transaction?: RedemptionTransaction;
  error?: string;
}

@Injectable()
export class RedemptionTransactionRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Atomic redemption transaction:
   * 1. Verify user has enough points
   * 2. Verify item has stock (if applicable)
   * 3. Deduct points
   * 4. Decrement stock
   * 5. Create redemption record
   * 6. Create ledger entry
   */
  async createAtomicRedemption(data: CreateRedemptionData): Promise<AtomicRedemptionResult> {
    return await this.db.transaction(async (tx) => {
      // Get user with points
      const user = await tx.query.endUsers.findFirst({
        where: eq(endUsers.id, data.endUserId),
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Get reward item
      const item = await tx.query.rewardItems.findFirst({
        where: eq(rewardItems.id, data.rewardItemId),
      });

      if (!item) {
        return { success: false, error: 'Reward item not found' };
      }

      if (!item.active) {
        return { success: false, error: 'Reward item is not available' };
      }

      // Verify points - use atomic SQL operation
      if (user.loyaltyPoints < data.costAtTime) {
        return { success: false, error: 'Insufficient points' };
      }

      // Verify and decrement stock atomically (if item has limited stock)
      if (item.stockQuantity !== null) {
        const stockResult = await tx
          .update(rewardItems)
          .set({
            stockQuantity: sql`${rewardItems.stockQuantity} - 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(rewardItems.id, data.rewardItemId),
              sql`${rewardItems.stockQuantity} > 0`,
            ),
          )
          .returning({ id: rewardItems.id });

        if (stockResult.length === 0) {
          return { success: false, error: 'Out of stock' };
        }
      }

      // Deduct points atomically with race condition protection
      const pointsResult = await tx
        .update(endUsers)
        .set({
          loyaltyPoints: sql`${endUsers.loyaltyPoints} - ${data.costAtTime}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(endUsers.id, data.endUserId),
            sql`${endUsers.loyaltyPoints} >= ${data.costAtTime}`,
          ),
        )
        .returning({ id: endUsers.id, loyaltyPoints: endUsers.loyaltyPoints });

      if (pointsResult.length === 0) {
        return { success: false, error: 'Insufficient points (concurrent modification)' };
      }

      const newBalance = pointsResult[0]!.loyaltyPoints;

      // Create ledger entry for the redemption
      await tx.insert(loyaltyLedger).values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        amount: -data.costAtTime,
        balance: newBalance,
        type: 'redeem',
        referenceType: 'reward_redemption',
        description: `Redeemed: ${item.name}`,
        metadata: {
          rewardItemId: data.rewardItemId,
          rewardName: item.name,
          rewardSku: item.sku,
        },
      });

      // Create redemption transaction
      const redemptionResult = await tx
        .insert(redemptionTransactions)
        .values({
          projectId: data.projectId,
          endUserId: data.endUserId,
          rewardItemId: data.rewardItemId,
          costAtTime: data.costAtTime,
          status: 'PROCESSING',
          metadata: data.metadata,
        })
        .returning();

      const transaction = redemptionResult[0];
      if (!transaction) {
        throw new Error('Failed to create redemption transaction');
      }

      return { success: true, transaction };
    });
  }

  async findById(id: string): Promise<RedemptionTransaction | null> {
    const result = await this.db.query.redemptionTransactions.findFirst({
      where: eq(redemptionTransactions.id, id),
    });
    return result ?? null;
  }

  async findByIdWithDetails(id: string): Promise<RedemptionWithDetails | null> {
    const result = await this.db.query.redemptionTransactions.findFirst({
      where: eq(redemptionTransactions.id, id),
      with: {
        rewardItem: {
          columns: {
            id: true,
            name: true,
            sku: true,
            fulfillmentType: true,
          },
        },
      },
    });
    return result ?? null;
  }

  async findByEndUserId(
    endUserId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<RedemptionTransaction[]> {
    const result = await this.db
      .select()
      .from(redemptionTransactions)
      .where(eq(redemptionTransactions.endUserId, endUserId))
      .orderBy(desc(redemptionTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findByProjectId(
    projectId: string,
    options: { status?: RedemptionStatus; limit?: number; offset?: number } = {},
  ): Promise<RedemptionTransaction[]> {
    const { status, limit = 100, offset = 0 } = options;

    const conditions = [eq(redemptionTransactions.projectId, projectId)];
    if (status) {
      conditions.push(eq(redemptionTransactions.status, status));
    }

    const result = await this.db
      .select()
      .from(redemptionTransactions)
      .where(and(...conditions))
      .orderBy(desc(redemptionTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findPendingWebhooks(
    maxRetries: number = 3,
    limit: number = 100,
  ): Promise<RedemptionTransaction[]> {
    const result = await this.db
      .select()
      .from(redemptionTransactions)
      .where(
        and(
          eq(redemptionTransactions.status, 'PROCESSING'),
          lt(redemptionTransactions.webhookRetries, maxRetries),
        ),
      )
      .orderBy(redemptionTransactions.createdAt)
      .limit(limit);

    return result;
  }

  async update(id: string, data: UpdateRedemptionData): Promise<void> {
    await this.db
      .update(redemptionTransactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(redemptionTransactions.id, id));
  }

  async markCompleted(
    id: string,
    fulfillmentData?: Record<string, unknown>,
  ): Promise<void> {
    await this.db
      .update(redemptionTransactions)
      .set({
        status: 'COMPLETED',
        fulfillmentData,
        fulfilledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(redemptionTransactions.id, id));
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.db
      .update(redemptionTransactions)
      .set({
        status: 'FAILED',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(redemptionTransactions.id, id));
  }

  async incrementWebhookRetry(id: string): Promise<void> {
    await this.db
      .update(redemptionTransactions)
      .set({
        webhookRetries: sql`${redemptionTransactions.webhookRetries} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(redemptionTransactions.id, id));
  }

  async getRedemptionStats(projectId: string): Promise<{
    total: number;
    completed: number;
    processing: number;
    failed: number;
  }> {
    const result = await this.db
      .select({
        total: sql<number>`COUNT(*)`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${redemptionTransactions.status} = 'COMPLETED')`,
        processing: sql<number>`COUNT(*) FILTER (WHERE ${redemptionTransactions.status} = 'PROCESSING')`,
        failed: sql<number>`COUNT(*) FILTER (WHERE ${redemptionTransactions.status} = 'FAILED')`,
      })
      .from(redemptionTransactions)
      .where(eq(redemptionTransactions.projectId, projectId));

    const stats = result[0];
    return {
      total: Number(stats?.total ?? 0),
      completed: Number(stats?.completed ?? 0),
      processing: Number(stats?.processing ?? 0),
      failed: Number(stats?.failed ?? 0),
    };
  }
}
