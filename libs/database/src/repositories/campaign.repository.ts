import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { campaigns, rules, Campaign, NewCampaign, Rule } from '../schema';

export interface CreateCampaignData {
  projectId: string;
  name: string;
  description?: string;
  active?: boolean;
  priority?: number;
  schedule?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  active?: boolean;
  priority?: number;
  schedule?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CampaignWithRules extends Campaign {
  rules: Rule[];
}

@Injectable()
export class CampaignRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateCampaignData): Promise<{ id: string }> {
    const result = await this.db
      .insert(campaigns)
      .values({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        active: data.active ?? true,
        priority: data.priority ?? 0,
        schedule: data.schedule,
        metadata: data.metadata,
      })
      .returning({ id: campaigns.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to insert campaign');
    }
    return inserted;
  }

  async findById(id: string): Promise<Campaign | null> {
    const result = await this.db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
    });
    return result ?? null;
  }

  async findByIdWithRules(id: string): Promise<CampaignWithRules | null> {
    const result = await this.db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
      with: {
        rules: true,
      },
    });
    return result ?? null;
  }

  async findByProjectId(projectId: string): Promise<Campaign[]> {
    const result = await this.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.projectId, projectId))
      .orderBy(desc(campaigns.priority), campaigns.name);

    return result;
  }

  async findActiveCampaigns(projectId: string): Promise<CampaignWithRules[]> {
    const result = await this.db.query.campaigns.findMany({
      where: and(eq(campaigns.projectId, projectId), eq(campaigns.active, true)),
      with: {
        rules: {
          where: eq(rules.active, true),
          orderBy: desc(rules.priority),
        },
      },
      orderBy: desc(campaigns.priority),
    });

    return result;
  }

  async update(id: string, data: UpdateCampaignData): Promise<void> {
    await this.db
      .update(campaigns)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(campaigns).where(eq(campaigns.id, id));
  }

  /**
   * Count active campaigns for a project.
   * Used for project stats summary.
   */
  async countActiveCampaigns(projectId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(campaigns)
      .where(and(eq(campaigns.projectId, projectId), eq(campaigns.active, true)));

    return result[0]?.count ?? 0;
  }
}
