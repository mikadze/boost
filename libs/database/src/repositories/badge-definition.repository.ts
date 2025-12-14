import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  badgeDefinitions,
  BadgeDefinition,
  BadgeRarity,
  BadgeVisibility,
  BadgeRuleType,
} from '../schema';

export interface CreateBadgeDefinitionData {
  projectId: string;
  name: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  rarity?: BadgeRarity;
  visibility?: BadgeVisibility;
  category?: string;
  ruleType?: BadgeRuleType;
  triggerMetric?: string;
  threshold?: number;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateBadgeDefinitionData {
  name?: string;
  description?: string | null;
  iconUrl?: string | null;
  imageUrl?: string | null;
  rarity?: BadgeRarity;
  visibility?: BadgeVisibility;
  category?: string | null;
  ruleType?: BadgeRuleType;
  triggerMetric?: string | null;
  threshold?: number | null;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class BadgeDefinitionRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateBadgeDefinitionData): Promise<BadgeDefinition> {
    const result = await this.db
      .insert(badgeDefinitions)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        iconUrl: data.iconUrl,
        imageUrl: data.imageUrl,
        rarity: data.rarity ?? 'COMMON',
        visibility: data.visibility ?? 'PUBLIC',
        category: data.category,
        ruleType: data.ruleType ?? 'METRIC_THRESHOLD',
        triggerMetric: data.triggerMetric,
        threshold: data.threshold,
        active: data.active ?? true,
        metadata: data.metadata,
      })
      .returning();

    const badge = result[0];
    if (!badge) {
      throw new Error('Failed to create badge definition');
    }

    return badge;
  }

  async findById(id: string): Promise<BadgeDefinition | null> {
    const result = await this.db
      .select()
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByProjectId(projectId: string): Promise<BadgeDefinition[]> {
    return await this.db
      .select()
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.projectId, projectId))
      .orderBy(desc(badgeDefinitions.createdAt));
  }

  async findActiveByProjectId(projectId: string): Promise<BadgeDefinition[]> {
    return await this.db
      .select()
      .from(badgeDefinitions)
      .where(
        and(
          eq(badgeDefinitions.projectId, projectId),
          eq(badgeDefinitions.active, true),
        ),
      )
      .orderBy(desc(badgeDefinitions.createdAt));
  }

  async findByCategory(projectId: string, category: string): Promise<BadgeDefinition[]> {
    return await this.db
      .select()
      .from(badgeDefinitions)
      .where(
        and(
          eq(badgeDefinitions.projectId, projectId),
          eq(badgeDefinitions.category, category),
        ),
      )
      .orderBy(desc(badgeDefinitions.createdAt));
  }

  async findByTriggerMetric(projectId: string, triggerMetric: string): Promise<BadgeDefinition[]> {
    return await this.db
      .select()
      .from(badgeDefinitions)
      .where(
        and(
          eq(badgeDefinitions.projectId, projectId),
          eq(badgeDefinitions.triggerMetric, triggerMetric),
          eq(badgeDefinitions.active, true),
        ),
      )
      .orderBy(desc(badgeDefinitions.createdAt));
  }

  async findByIds(ids: string[]): Promise<BadgeDefinition[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.db
      .select()
      .from(badgeDefinitions)
      .where(inArray(badgeDefinitions.id, ids));
  }

  async update(id: string, data: UpdateBadgeDefinitionData): Promise<BadgeDefinition | null> {
    const result = await this.db
      .update(badgeDefinitions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(badgeDefinitions.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(badgeDefinitions)
      .where(eq(badgeDefinitions.id, id))
      .returning({ id: badgeDefinitions.id });

    return result.length > 0;
  }

  async activate(id: string): Promise<BadgeDefinition | null> {
    return this.update(id, { active: true });
  }

  async deactivate(id: string): Promise<BadgeDefinition | null> {
    return this.update(id, { active: false });
  }

  async getDistinctCategories(projectId: string): Promise<string[]> {
    const result = await this.db
      .selectDistinct({ category: badgeDefinitions.category })
      .from(badgeDefinitions)
      .where(eq(badgeDefinitions.projectId, projectId));

    return result
      .map((r) => r.category)
      .filter((c): c is string => c !== null);
  }
}
