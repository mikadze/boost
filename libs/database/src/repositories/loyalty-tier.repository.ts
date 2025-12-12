import { Injectable, Inject } from '@nestjs/common';
import { eq, and, lte, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { loyaltyTiers, LoyaltyTier, NewLoyaltyTier } from '../schema';

export interface CreateLoyaltyTierData {
  projectId: string;
  name: string;
  minPoints: number;
  benefits?: Record<string, unknown>;
  level?: number;
  color?: string;
  iconUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateLoyaltyTierData {
  name?: string;
  minPoints?: number;
  benefits?: Record<string, unknown>;
  level?: number;
  color?: string;
  iconUrl?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class LoyaltyTierRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateLoyaltyTierData): Promise<{ id: string }> {
    const result = await this.db
      .insert(loyaltyTiers)
      .values({
        projectId: data.projectId,
        name: data.name,
        minPoints: data.minPoints,
        benefits: data.benefits ?? {},
        level: data.level ?? 0,
        color: data.color,
        iconUrl: data.iconUrl,
        metadata: data.metadata,
      })
      .returning({ id: loyaltyTiers.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to create loyalty tier');
    }
    return inserted;
  }

  async findById(id: string): Promise<LoyaltyTier | null> {
    const result = await this.db.query.loyaltyTiers.findFirst({
      where: eq(loyaltyTiers.id, id),
    });
    return result ?? null;
  }

  async findByProjectId(projectId: string): Promise<LoyaltyTier[]> {
    const result = await this.db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.projectId, projectId))
      .orderBy(loyaltyTiers.level, loyaltyTiers.minPoints);

    return result;
  }

  async findTierForPoints(
    projectId: string,
    points: number,
  ): Promise<LoyaltyTier | null> {
    // Find the highest tier the user qualifies for
    const result = await this.db
      .select()
      .from(loyaltyTiers)
      .where(
        and(
          eq(loyaltyTiers.projectId, projectId),
          lte(loyaltyTiers.minPoints, points),
        ),
      )
      .orderBy(desc(loyaltyTiers.level), desc(loyaltyTiers.minPoints))
      .limit(1);

    return result[0] ?? null;
  }

  async findNextTier(
    projectId: string,
    currentPoints: number,
  ): Promise<LoyaltyTier | null> {
    // Find the next tier above current points
    const result = await this.db
      .select()
      .from(loyaltyTiers)
      .where(eq(loyaltyTiers.projectId, projectId))
      .orderBy(loyaltyTiers.level, loyaltyTiers.minPoints);

    const tiers = result;
    for (const tier of tiers) {
      if (tier.minPoints > currentPoints) {
        return tier;
      }
    }

    return null; // User is at highest tier
  }

  async update(id: string, data: UpdateLoyaltyTierData): Promise<void> {
    await this.db
      .update(loyaltyTiers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(loyaltyTiers.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(loyaltyTiers).where(eq(loyaltyTiers.id, id));
  }
}
