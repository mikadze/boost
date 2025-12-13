import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  referralTracking,
  endUsers,
  ReferralTracking,
} from '../schema';

export interface CreateReferralTrackingData {
  projectId: string;
  referrerId: string;
  referredExternalId: string;
  referralCode: string;
  source?: string;
}

@Injectable()
export class ReferralTrackingRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateReferralTrackingData): Promise<ReferralTracking> {
    const result = await this.db
      .insert(referralTracking)
      .values({
        projectId: data.projectId,
        referrerId: data.referrerId,
        referredExternalId: data.referredExternalId,
        referralCode: data.referralCode,
        source: data.source ?? 'url_param',
      })
      .returning();

    const entry = result[0];
    if (!entry) {
      throw new Error('Failed to create referral tracking entry');
    }

    return entry;
  }

  async findByReferredExternalId(
    projectId: string,
    referredExternalId: string,
  ): Promise<ReferralTracking | null> {
    const result = await this.db
      .select()
      .from(referralTracking)
      .where(
        and(
          eq(referralTracking.projectId, projectId),
          eq(referralTracking.referredExternalId, referredExternalId),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findByReferrerId(
    referrerId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ReferralTracking[]> {
    return await this.db
      .select()
      .from(referralTracking)
      .where(eq(referralTracking.referrerId, referrerId))
      .orderBy(desc(referralTracking.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findReferrerByCode(
    projectId: string,
    referralCode: string,
  ): Promise<{ referrerId: string; endUserId: string } | null> {
    const result = await this.db
      .select({
        referrerId: endUsers.id,
        endUserId: endUsers.id,
      })
      .from(endUsers)
      .where(
        and(
          eq(endUsers.projectId, projectId),
          eq(endUsers.referralCode, referralCode),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async countByReferrerId(referrerId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referralTracking)
      .where(eq(referralTracking.referrerId, referrerId));

    return Number(result[0]?.count ?? 0);
  }

  async findByProjectId(
    projectId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<ReferralTracking[]> {
    return await this.db
      .select()
      .from(referralTracking)
      .where(eq(referralTracking.projectId, projectId))
      .orderBy(desc(referralTracking.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async exists(
    projectId: string,
    referredExternalId: string,
  ): Promise<boolean> {
    const result = await this.findByReferredExternalId(projectId, referredExternalId);
    return result !== null;
  }
}
