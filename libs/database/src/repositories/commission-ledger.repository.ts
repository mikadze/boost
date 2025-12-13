import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, sum } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  commissionLedger,
  CommissionLedgerEntry,
  CommissionStatus,
} from '../schema';

export interface CreateCommissionLedgerData {
  projectId: string;
  endUserId: string;
  commissionPlanId: string;
  amount: number;
  sourceAmount: number;
  sourceEventId?: string;
  orderId?: string;
  referredUserId?: string;
  currency?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface CommissionSummary {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  totalRejected: number;
  transactionCount: number;
}

@Injectable()
export class CommissionLedgerRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateCommissionLedgerData): Promise<CommissionLedgerEntry> {
    const result = await this.db
      .insert(commissionLedger)
      .values({
        projectId: data.projectId,
        endUserId: data.endUserId,
        commissionPlanId: data.commissionPlanId,
        amount: data.amount,
        sourceAmount: data.sourceAmount,
        status: 'PENDING',
        sourceEventId: data.sourceEventId,
        orderId: data.orderId,
        referredUserId: data.referredUserId,
        currency: data.currency ?? 'USD',
        notes: data.notes,
        metadata: data.metadata,
      })
      .returning();

    const entry = result[0];
    if (!entry) {
      throw new Error('Failed to create commission ledger entry');
    }

    return entry;
  }

  async findById(id: string): Promise<CommissionLedgerEntry | null> {
    const result = await this.db
      .select()
      .from(commissionLedger)
      .where(eq(commissionLedger.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByEndUserId(
    endUserId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<CommissionLedgerEntry[]> {
    return await this.db
      .select()
      .from(commissionLedger)
      .where(eq(commissionLedger.endUserId, endUserId))
      .orderBy(desc(commissionLedger.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findByProjectId(
    projectId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<CommissionLedgerEntry[]> {
    return await this.db
      .select()
      .from(commissionLedger)
      .where(eq(commissionLedger.projectId, projectId))
      .orderBy(desc(commissionLedger.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findByStatus(
    projectId: string,
    status: CommissionStatus,
    limit: number = 100,
    offset: number = 0,
  ): Promise<CommissionLedgerEntry[]> {
    return await this.db
      .select()
      .from(commissionLedger)
      .where(
        and(
          eq(commissionLedger.projectId, projectId),
          eq(commissionLedger.status, status),
        ),
      )
      .orderBy(desc(commissionLedger.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findBySourceEvent(sourceEventId: string): Promise<CommissionLedgerEntry | null> {
    const result = await this.db
      .select()
      .from(commissionLedger)
      .where(eq(commissionLedger.sourceEventId, sourceEventId))
      .limit(1);

    return result[0] ?? null;
  }

  async updateStatus(
    id: string,
    status: CommissionStatus,
    notes?: string,
  ): Promise<CommissionLedgerEntry | null> {
    const updateData: Partial<CommissionLedgerEntry> = { status };

    if (status === 'PAID') {
      updateData.paidAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const result = await this.db
      .update(commissionLedger)
      .set(updateData)
      .where(eq(commissionLedger.id, id))
      .returning();

    return result[0] ?? null;
  }

  async getSummaryByEndUser(endUserId: string): Promise<CommissionSummary> {
    const result = await this.db
      .select({
        totalEarned: sql<number>`COALESCE(SUM(${commissionLedger.amount}), 0)`,
        totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${commissionLedger.status} = 'PENDING' THEN ${commissionLedger.amount} ELSE 0 END), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${commissionLedger.status} = 'PAID' THEN ${commissionLedger.amount} ELSE 0 END), 0)`,
        totalRejected: sql<number>`COALESCE(SUM(CASE WHEN ${commissionLedger.status} = 'REJECTED' THEN ${commissionLedger.amount} ELSE 0 END), 0)`,
        transactionCount: sql<number>`COUNT(*)`,
      })
      .from(commissionLedger)
      .where(eq(commissionLedger.endUserId, endUserId));

    const summary = result[0];
    return {
      totalEarned: Number(summary?.totalEarned ?? 0),
      totalPending: Number(summary?.totalPending ?? 0),
      totalPaid: Number(summary?.totalPaid ?? 0),
      totalRejected: Number(summary?.totalRejected ?? 0),
      transactionCount: Number(summary?.transactionCount ?? 0),
    };
  }

  async countByEndUser(endUserId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(commissionLedger)
      .where(eq(commissionLedger.endUserId, endUserId));

    return Number(result[0]?.count ?? 0);
  }
}
