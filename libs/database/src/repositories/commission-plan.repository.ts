import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import {
  commissionPlans,
  CommissionPlan,
  CommissionPlanType,
} from '../schema';

export interface CreateCommissionPlanData {
  projectId: string;
  name: string;
  description?: string;
  type: CommissionPlanType;
  value: number;
  currency?: string;
  isDefault?: boolean;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateCommissionPlanData {
  name?: string;
  description?: string;
  type?: CommissionPlanType;
  value?: number;
  currency?: string;
  isDefault?: boolean;
  active?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CommissionPlanRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateCommissionPlanData): Promise<CommissionPlan> {
    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await this.db
        .update(commissionPlans)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(commissionPlans.projectId, data.projectId),
            eq(commissionPlans.isDefault, true),
          ),
        );
    }

    const result = await this.db
      .insert(commissionPlans)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        currency: data.currency ?? 'USD',
        isDefault: data.isDefault ?? false,
        active: data.active ?? true,
        metadata: data.metadata,
      })
      .returning();

    const plan = result[0];
    if (!plan) {
      throw new Error('Failed to create commission plan');
    }

    return plan;
  }

  async findById(id: string): Promise<CommissionPlan | null> {
    const result = await this.db
      .select()
      .from(commissionPlans)
      .where(eq(commissionPlans.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByProjectId(projectId: string): Promise<CommissionPlan[]> {
    return await this.db
      .select()
      .from(commissionPlans)
      .where(eq(commissionPlans.projectId, projectId))
      .orderBy(desc(commissionPlans.createdAt));
  }

  async findDefaultForProject(projectId: string): Promise<CommissionPlan | null> {
    const result = await this.db
      .select()
      .from(commissionPlans)
      .where(
        and(
          eq(commissionPlans.projectId, projectId),
          eq(commissionPlans.isDefault, true),
          eq(commissionPlans.active, true),
        ),
      )
      .limit(1);

    return result[0] ?? null;
  }

  async findActiveByProjectId(projectId: string): Promise<CommissionPlan[]> {
    return await this.db
      .select()
      .from(commissionPlans)
      .where(
        and(
          eq(commissionPlans.projectId, projectId),
          eq(commissionPlans.active, true),
        ),
      )
      .orderBy(desc(commissionPlans.createdAt));
  }

  async update(id: string, data: UpdateCommissionPlanData): Promise<CommissionPlan | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await this.db
        .update(commissionPlans)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(commissionPlans.projectId, existing.projectId),
            eq(commissionPlans.isDefault, true),
          ),
        );
    }

    const result = await this.db
      .update(commissionPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(commissionPlans.id, id))
      .returning();

    return result[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(commissionPlans)
      .where(eq(commissionPlans.id, id))
      .returning({ id: commissionPlans.id });

    return result.length > 0;
  }
}
