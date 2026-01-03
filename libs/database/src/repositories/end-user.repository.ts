import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { endUsers, EndUser, NewEndUser } from '../schema';

export interface CreateEndUserData {
  projectId: string;
  externalId: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEndUserData {
  metadata?: Record<string, unknown>;
  loyaltyPoints?: number;
  tierId?: string | null;
  // Issue #20: Affiliate fields
  commissionPlanId?: string | null;
  referralCode?: string | null;
}

@Injectable()
export class EndUserRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateEndUserData): Promise<EndUser> {
    const result = await this.db
      .insert(endUsers)
      .values({
        projectId: data.projectId,
        externalId: data.externalId,
        metadata: data.metadata,
        loyaltyPoints: 0,
      })
      .returning();

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to create end user');
    }
    return inserted;
  }

  async findById(id: string): Promise<EndUser | null> {
    const result = await this.db.query.endUsers.findFirst({
      where: eq(endUsers.id, id),
    });
    return result ?? null;
  }

  async findByExternalId(
    projectId: string,
    externalId: string,
  ): Promise<EndUser | null> {
    const result = await this.db.query.endUsers.findFirst({
      where: and(
        eq(endUsers.projectId, projectId),
        eq(endUsers.externalId, externalId),
      ),
    });
    return result ?? null;
  }

  async findOrCreate(
    projectId: string,
    externalId: string,
    metadata?: Record<string, unknown>,
  ): Promise<EndUser> {
    // First try to find existing user
    let user = await this.findByExternalId(projectId, externalId);
    if (user) {
      return user;
    }

    // Try to insert with ON CONFLICT DO NOTHING to handle race conditions
    try {
      const result = await this.db
        .insert(endUsers)
        .values({
          projectId,
          externalId,
          metadata,
          loyaltyPoints: 0,
        })
        .onConflictDoNothing({
          target: [endUsers.projectId, endUsers.externalId],
        })
        .returning();

      if (result[0]) {
        return result[0];
      }

      // Insert returned nothing (conflict occurred), fetch the existing user
      user = await this.findByExternalId(projectId, externalId);
      if (user) {
        return user;
      }

      throw new Error('Failed to find or create end user');
    } catch (error) {
      // Handle unique constraint violation (fallback for race condition)
      if ((error as { code?: string }).code === '23505') {
        user = await this.findByExternalId(projectId, externalId);
        if (user) {
          return user;
        }
      }
      throw error;
    }
  }

  async findByProjectId(projectId: string): Promise<EndUser[]> {
    const result = await this.db
      .select()
      .from(endUsers)
      .where(eq(endUsers.projectId, projectId))
      .orderBy(endUsers.createdAt);

    return result;
  }

  async update(id: string, data: UpdateEndUserData): Promise<void> {
    await this.db
      .update(endUsers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(endUsers.id, id));
  }

  async updateByExternalId(
    projectId: string,
    externalId: string,
    data: UpdateEndUserData,
  ): Promise<void> {
    await this.db
      .update(endUsers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(endUsers.projectId, projectId), eq(endUsers.externalId, externalId)),
      );
  }

  async updateLoyaltyPoints(id: string, points: number): Promise<void> {
    await this.db
      .update(endUsers)
      .set({
        loyaltyPoints: points,
        updatedAt: new Date(),
      })
      .where(eq(endUsers.id, id));
  }

  async updateTier(id: string, tierId: string | null): Promise<void> {
    await this.db
      .update(endUsers)
      .set({
        tierId,
        updatedAt: new Date(),
      })
      .where(eq(endUsers.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(endUsers).where(eq(endUsers.id, id));
  }

  // Issue #20: Affiliate methods
  async findByReferralCode(
    projectId: string,
    referralCode: string,
  ): Promise<EndUser | null> {
    const result = await this.db.query.endUsers.findFirst({
      where: and(
        eq(endUsers.projectId, projectId),
        eq(endUsers.referralCode, referralCode),
      ),
    });
    return result ?? null;
  }

  async updateCommissionPlan(id: string, commissionPlanId: string | null): Promise<void> {
    await this.db
      .update(endUsers)
      .set({
        commissionPlanId,
        updatedAt: new Date(),
      })
      .where(eq(endUsers.id, id));
  }
}
