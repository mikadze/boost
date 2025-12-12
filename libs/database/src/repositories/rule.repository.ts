import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../schema';
import { rules, Rule, NewRule } from '../schema';

export interface CreateRuleData {
  campaignId: string;
  projectId: string;
  name: string;
  description?: string;
  active?: boolean;
  priority?: number;
  eventTypes?: string[];
  conditions: Record<string, unknown>;
  effects: Record<string, unknown>[];
}

export interface UpdateRuleData {
  name?: string;
  description?: string;
  active?: boolean;
  priority?: number;
  eventTypes?: string[];
  conditions?: Record<string, unknown>;
  effects?: Record<string, unknown>[];
}

@Injectable()
export class RuleRepository {
  constructor(
    @Inject('DRIZZLE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: CreateRuleData): Promise<{ id: string }> {
    const result = await this.db
      .insert(rules)
      .values({
        campaignId: data.campaignId,
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        active: data.active ?? true,
        priority: data.priority ?? 0,
        eventTypes: data.eventTypes ?? [],
        conditions: data.conditions,
        effects: data.effects,
      })
      .returning({ id: rules.id });

    const inserted = result[0];
    if (!inserted) {
      throw new Error('Failed to insert rule');
    }
    return inserted;
  }

  async findById(id: string): Promise<Rule | null> {
    const result = await this.db.query.rules.findFirst({
      where: eq(rules.id, id),
    });
    return result ?? null;
  }

  async findByCampaignId(campaignId: string): Promise<Rule[]> {
    const result = await this.db
      .select()
      .from(rules)
      .where(eq(rules.campaignId, campaignId))
      .orderBy(desc(rules.priority), rules.name);

    return result;
  }

  async findByProjectId(projectId: string): Promise<Rule[]> {
    const result = await this.db
      .select()
      .from(rules)
      .where(eq(rules.projectId, projectId))
      .orderBy(desc(rules.priority), rules.name);

    return result;
  }

  async findActiveRulesForEventType(
    projectId: string,
    eventType: string,
  ): Promise<Rule[]> {
    // Get all active rules for the project and filter by event type
    const allRules = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.projectId, projectId), eq(rules.active, true)))
      .orderBy(desc(rules.priority));

    // Filter rules that match the event type (or have no event types specified)
    return allRules.filter((rule) => {
      const eventTypes = rule.eventTypes as string[];
      return eventTypes.length === 0 || eventTypes.includes(eventType);
    });
  }

  async update(id: string, data: UpdateRuleData): Promise<void> {
    await this.db
      .update(rules)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(rules.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(rules).where(eq(rules.id, id));
  }
}
