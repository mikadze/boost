import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CampaignRepository,
  RuleRepository,
  Rule,
  Campaign,
} from '@boost/database';
import {
  RawEventMessage,
  RuleCondition,
  RuleConditionGroup,
  RuleEffect,
  ComparisonOperator,
  EvaluatedRuleResult,
  CampaignSchedule,
} from '@boost/common';

const CACHE_TTL_MS = 60_000; // 1 minute cache for active campaigns

interface CachedCampaigns {
  campaigns: CampaignWithRules[];
  cachedAt: number;
}

interface CampaignWithRules extends Campaign {
  rules: Rule[];
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);
  private campaignCache = new Map<string, CachedCampaigns>();

  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly ruleRepository: RuleRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Evaluate an event against all active rules
   * Returns matched effects to apply
   */
  async evaluate(event: RawEventMessage): Promise<EvaluatedRuleResult[]> {
    const { projectId, event: eventType } = event;

    this.logger.debug(
      `Evaluating rules for project ${projectId}, event: ${eventType}`,
    );

    // Load active campaigns with caching
    const campaigns = await this.getActiveCampaigns(projectId);

    if (campaigns.length === 0) {
      this.logger.debug('No active campaigns found');
      return [];
    }

    // Flatten event data for comparison
    const flattenedEvent = this.flattenObject(event as unknown as Record<string, unknown>);

    const results: EvaluatedRuleResult[] = [];

    // Iterate through campaigns by priority
    for (const campaign of campaigns) {
      // Check campaign schedule
      if (!this.isCampaignActive(campaign)) {
        continue;
      }

      // Iterate through rules by priority
      for (const rule of campaign.rules) {
        if (!rule.active) continue;

        // Check if rule applies to this event type
        const ruleEventTypes = rule.eventTypes as string[];
        if (ruleEventTypes.length > 0 && !ruleEventTypes.includes(eventType)) {
          continue;
        }

        // Evaluate rule conditions
        const conditions = rule.conditions as RuleConditionGroup;
        const matched = this.evaluateConditions(conditions, flattenedEvent);

        if (matched) {
          const effects = rule.effects as RuleEffect[];
          this.logger.log(
            `Rule "${rule.name}" matched for event ${eventType}. Effects: ${effects.length}`,
          );

          results.push({
            ruleId: rule.id,
            campaignId: campaign.id,
            effects,
            priority: rule.priority,
          });
        }
      }
    }

    this.logger.debug(
      `Evaluation complete. ${results.length} rules matched.`,
    );

    return results;
  }

  /**
   * Get active campaigns with caching
   */
  private async getActiveCampaigns(
    projectId: string,
  ): Promise<CampaignWithRules[]> {
    const cacheKey = `campaigns:${projectId}`;
    const cached = this.campaignCache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.campaigns;
    }

    // Fetch from database
    const campaigns = await this.campaignRepository.findActiveCampaigns(projectId);

    // Cache the result
    this.campaignCache.set(cacheKey, {
      campaigns,
      cachedAt: Date.now(),
    });

    return campaigns;
  }

  /**
   * Check if campaign is active based on schedule
   */
  private isCampaignActive(campaign: Campaign): boolean {
    if (!campaign.active) return false;

    const schedule = campaign.schedule as CampaignSchedule | null;
    if (!schedule) return true;

    const now = new Date();

    // Check date range
    if (schedule.startDate && now < new Date(schedule.startDate)) {
      return false;
    }
    if (schedule.endDate && now > new Date(schedule.endDate)) {
      return false;
    }

    // Check days of week
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      const dayOfWeek = now.getDay();
      if (!schedule.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check time of day
    if (schedule.startTime || schedule.endTime) {
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (schedule.startTime && timeStr < schedule.startTime) {
        return false;
      }
      if (schedule.endTime && timeStr > schedule.endTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a condition group against flattened event data
   */
  private evaluateConditions(
    group: RuleConditionGroup,
    data: Record<string, unknown>,
  ): boolean {
    if (!group.conditions || group.conditions.length === 0) {
      return true; // No conditions = always match
    }

    const { logic, conditions } = group;

    if (logic === 'and') {
      return conditions.every((condition) =>
        this.evaluateCondition(condition, data),
      );
    } else {
      return conditions.some((condition) =>
        this.evaluateCondition(condition, data),
      );
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: RuleCondition,
    data: Record<string, unknown>,
  ): boolean {
    const { field, operator, value } = condition;
    const actualValue = data[field];

    return this.compareValues(actualValue, operator, value);
  }

  /**
   * Compare values using the specified operator
   */
  private compareValues(
    actual: unknown,
    operator: ComparisonOperator,
    expected: unknown,
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;

      case 'not_equals':
        return actual !== expected;

      case 'greater_than':
        return (
          typeof actual === 'number' &&
          typeof expected === 'number' &&
          actual > expected
        );

      case 'greater_than_or_equal':
        return (
          typeof actual === 'number' &&
          typeof expected === 'number' &&
          actual >= expected
        );

      case 'less_than':
        return (
          typeof actual === 'number' &&
          typeof expected === 'number' &&
          actual < expected
        );

      case 'less_than_or_equal':
        return (
          typeof actual === 'number' &&
          typeof expected === 'number' &&
          actual <= expected
        );

      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;

      case 'not_contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return !actual.includes(expected);
        }
        if (Array.isArray(actual)) {
          return !actual.includes(expected);
        }
        return true;

      case 'starts_with':
        return (
          typeof actual === 'string' &&
          typeof expected === 'string' &&
          actual.startsWith(expected)
        );

      case 'ends_with':
        return (
          typeof actual === 'string' &&
          typeof expected === 'string' &&
          actual.endsWith(expected)
        );

      case 'in':
        return Array.isArray(expected) && expected.includes(actual);

      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);

      case 'exists':
        return actual !== undefined && actual !== null;

      case 'not_exists':
        return actual === undefined || actual === null;

      default:
        this.logger.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Flatten nested object using dot notation
   * e.g., { properties: { items: [{ sku: '123' }] } }
   * becomes { 'properties.items.0.sku': '123' }
   */
  private flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = value;
      } else if (Array.isArray(value)) {
        // Keep array value at current key for array operators
        result[newKey] = value;
        // Also flatten array elements
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.assign(
              result,
              this.flattenObject(item as Record<string, unknown>, `${newKey}.${index}`),
            );
          } else {
            result[`${newKey}.${index}`] = item;
          }
        });
      } else if (typeof value === 'object') {
        Object.assign(
          result,
          this.flattenObject(value as Record<string, unknown>, newKey),
        );
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  /**
   * Clear campaign cache for a project
   */
  clearCache(projectId: string): void {
    const cacheKey = `campaigns:${projectId}`;
    this.campaignCache.delete(cacheKey);
    this.logger.debug(`Cleared campaign cache for project ${projectId}`);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.campaignCache.clear();
    this.logger.debug('Cleared all campaign caches');
  }
}
