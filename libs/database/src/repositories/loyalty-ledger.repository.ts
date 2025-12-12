import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  loyaltyLedger,
  endUsers,
  LoyaltyLedgerEntry,
  LoyaltyTransactionType,
} from '../schema';

export interface CreateLedgerEntryData {
  projectId: string;
  endUserId: string;
  amount: number;
  type: LoyaltyTransactionType;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface LedgerSummary {
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  transactionCount: number;
}

@Injectable()
export class LoyaltyLedgerRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async addTransaction(data: CreateLedgerEntryData): Promise<LoyaltyLedgerEntry> {
    return await this.db.transaction(async (tx) => {
      // Get current balance
      const user = await tx.query.endUsers.findFirst({
        where: eq(endUsers.id, data.endUserId),
      });

      if (!user) {
        throw new Error('End user not found');
      }

      const currentBalance = user.loyaltyPoints;
      const newBalance = currentBalance + data.amount;

      // Prevent negative balance on redemption
      if (newBalance < 0) {
        throw new Error('Insufficient points balance');
      }

      // Create ledger entry
      const ledgerResult = await tx
        .insert(loyaltyLedger)
        .values({
          projectId: data.projectId,
          endUserId: data.endUserId,
          amount: data.amount,
          balance: newBalance,
          type: data.type,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          description: data.description,
          metadata: data.metadata,
          expiresAt: data.expiresAt,
        })
        .returning();

      // Update user's points balance
      await tx
        .update(endUsers)
        .set({
          loyaltyPoints: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(endUsers.id, data.endUserId));

      const entry = ledgerResult[0];
      if (!entry) {
        throw new Error('Failed to create ledger entry');
      }

      return entry;
    });
  }

  async findByEndUserId(
    endUserId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<LoyaltyLedgerEntry[]> {
    const result = await this.db
      .select()
      .from(loyaltyLedger)
      .where(eq(loyaltyLedger.endUserId, endUserId))
      .orderBy(desc(loyaltyLedger.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findByProjectId(
    projectId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<LoyaltyLedgerEntry[]> {
    const result = await this.db
      .select()
      .from(loyaltyLedger)
      .where(eq(loyaltyLedger.projectId, projectId))
      .orderBy(desc(loyaltyLedger.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  async findByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<LoyaltyLedgerEntry[]> {
    const result = await this.db
      .select()
      .from(loyaltyLedger)
      .where(
        and(
          eq(loyaltyLedger.referenceType, referenceType),
          eq(loyaltyLedger.referenceId, referenceId),
        ),
      );

    return result;
  }

  async getSummary(endUserId: string): Promise<LedgerSummary> {
    const result = await this.db
      .select({
        totalEarned: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyLedger.amount} > 0 THEN ${loyaltyLedger.amount} ELSE 0 END), 0)`,
        totalRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${loyaltyLedger.amount} < 0 THEN ABS(${loyaltyLedger.amount}) ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(loyaltyLedger)
      .where(eq(loyaltyLedger.endUserId, endUserId));

    const user = await this.db.query.endUsers.findFirst({
      where: eq(endUsers.id, endUserId),
    });

    const summary = result[0];
    return {
      totalEarned: Number(summary?.totalEarned ?? 0),
      totalRedeemed: Number(summary?.totalRedeemed ?? 0),
      currentBalance: user?.loyaltyPoints ?? 0,
      transactionCount: Number(summary?.transactionCount ?? 0),
    };
  }
}
