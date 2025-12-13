import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, gte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  progressionRules,
  ProgressionRule,
} from '../schema';

export interface CreateProgressionRuleData {
  projectId: string;
  name: string;
  description?: string;
  triggerMetric: string;
  threshold: number;
  actionTargetPlanId: string;
  priority?: number;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateProgressionRuleData {
  name?: string;
  description?: string;
  triggerMetric?: string;
  threshold?: number;
  actionTargetPlanId?: string;
  priority?: number;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ProgressionRuleRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateProgressionRuleData): Promise<ProgressionRule> {
    const result = await this.db
      .insert(progressionRules)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        triggerMetric: data.triggerMetric,
        threshold: data.threshold,
        actionTargetPlanId: data.actionTargetPlanId,
        priority: data.priority ?? 0,
        active: data.active ?? true,
        metadata: data.metadata,
      })
      .returning();

    const rule = result[0];
    if (!rule) {
      throw new Error('Failed to create progression rule');
    }

    return rule;
  }

  async findById(id: string): Promise<ProgressionRule | null> {
    const result = await this.db
      .select()
      .from(progressionRules)
      .where(eq(progressionRules.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByProjectId(projectId: string): Promise<ProgressionRule[]> {
    return await this.db
      .select()
      .from(progressionRules)
      .where(eq(progressionRules.projectId, projectId))
      .orderBy(desc(progressionRules.priority), desc(progressionRules.createdAt));
  }

  async findActiveByProjectId(projectId: string): Promise<ProgressionRule[]> {
    return await this.db
      .select()
      .from(progressionRules)
      .where(
        and(
          eq(progressionRules.projectId, projectId),
          eq(progressionRules.active, true),
        ),
      )
      .orderBy(desc(progressionRules.priority), desc(progressionRules.createdAt));
  }

  async findByMetric(projectId: string, metric: string): Promise<ProgressionRule[]> {
    return await this.db
      .select()
      .from(progressionRules)
      .where(
        and(
          eq(progressionRules.projectId, projectId),
          eq(progressionRules.triggerMetric, metric),
          eq(progressionRules.active, true),
        ),
      )
      .orderBy(desc(progressionRules.priority));
  }

  async findMatchingRules(
    projectId: string,
    metric: string,
    value: number,
  ): Promise<ProgressionRule[]> {
    return await this.db
      .select()
      .from(progressionRules)
      .where(
        and(
          eq(progressionRules.projectId, projectId),
          eq(progressionRules.triggerMetric, metric),
          eq(progressionRules.active, true),
          gte(progressionRules.threshold, 0), // All thresholds are valid
        ),
      )
      .orderBy(desc(progressionRules.threshold)); // Higher thresholds first
  }

  async update(id: string, data: UpdateProgressionRuleData): Promise<ProgressionRule | null> {
    const result = await this.db
      .update(progressionRules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(progressionRules.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(progressionRules)
      .where(eq(progressionRules.id, id))
      .returning({ id: progressionRules.id });

    return result.length > 0;
  }
}
