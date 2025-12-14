import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RawEventMessage } from '@boost/common';
import {
  StreakRuleRepository,
  UserStreakRepository,
  StreakHistoryRepository,
  EndUserRepository,
  LoyaltyLedgerRepository,
  StreakRule,
  StreakMilestone,
} from '@boost/database';
import { EventHandler } from './event-handler.interface';

/**
 * Streak Event Handler (Story 2.2)
 *
 * Implements the Streak Processor logic:
 * 1. Listens for ANY user event that matches configured streak rules
 * 2. Evaluates the activity date against streak rules
 * 3. If activity matches today's date: no action (already counted)
 * 4. If activity matches yesterday: increment counter
 * 5. If older: trigger reset mechanics (freeze or break)
 * 6. Awards rewards at milestone thresholds (e.g., 7-day milestone)
 * 7. Emits streak events to Kafka for further processing
 *
 * NOTE: Only 'daily' frequency is currently implemented.
 * TODO: Implement 'weekly' frequency support (Issue #32 Story 2.3)
 */
@Injectable()
export class StreakEventHandler implements EventHandler {
  private readonly logger = new Logger(StreakEventHandler.name);

  // Cache for matching rules to avoid duplicate queries between shouldHandle and handle
  private rulesCache = new Map<string, { rules: StreakRule[]; timestamp: number }>();
  private readonly CACHE_TTL_MS = 5000; // 5 second cache

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly streakRuleRepository: StreakRuleRepository,
    private readonly userStreakRepository: UserStreakRepository,
    private readonly streakHistoryRepository: StreakHistoryRepository,
    private readonly endUserRepository: EndUserRepository,
    private readonly loyaltyLedgerRepository: LoyaltyLedgerRepository,
  ) {}

  /**
   * This handler processes events dynamically based on streak rule configurations.
   * We return a special marker - actual matching happens at runtime.
   */
  getSupportedTypes(): string[] {
    return ['__streak_progress__'];
  }

  /**
   * Get cache key for rules lookup
   */
  private getCacheKey(projectId: string, eventType: string): string {
    return `${projectId}:${eventType}`;
  }

  /**
   * Get matching rules with caching to avoid duplicate queries
   */
  private async getMatchingRules(
    projectId: string,
    eventType: string,
  ): Promise<StreakRule[]> {
    const cacheKey = this.getCacheKey(projectId, eventType);
    const cached = this.rulesCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.rules;
    }

    const rules = await this.streakRuleRepository.findByEventType(
      projectId,
      eventType,
    );

    this.rulesCache.set(cacheKey, { rules, timestamp: Date.now() });
    return rules;
  }

  /**
   * Check if this event should trigger streak progress evaluation
   */
  async shouldHandle(event: RawEventMessage): Promise<boolean> {
    if (!event.userId) {
      return false;
    }

    // Check if there are any active streak rules matching this event type
    // Results are cached for use in handle()
    const matchingRules = await this.getMatchingRules(
      event.projectId,
      event.event,
    );

    return matchingRules.length > 0;
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Evaluating streak progress for event: ${event.event}`);

    const userId = event.userId;
    if (!userId) {
      this.logger.debug('No userId in event, skipping streak evaluation');
      return;
    }

    // Find the end user record
    const endUser = await this.endUserRepository.findByExternalId(
      event.projectId,
      userId,
    );
    if (!endUser) {
      this.logger.debug(
        `End user ${userId} not found, skipping streak evaluation`,
      );
      return;
    }

    // Get matching rules from cache (populated by shouldHandle)
    const matchingRules = await this.getMatchingRules(
      event.projectId,
      event.event,
    );

    if (matchingRules.length === 0) {
      this.logger.debug(`No streak rules match event: ${event.event}`);
      return;
    }

    this.logger.debug(
      `Found ${matchingRules.length} streak rules matching event: ${event.event}`,
    );

    // Process each matching rule
    for (const rule of matchingRules) {
      // Skip weekly frequency rules until implemented
      if (rule.frequency === 'weekly') {
        this.logger.warn(
          `Weekly frequency not yet implemented for streak rule: ${rule.name}`,
        );
        continue;
      }
      await this.processStreakRule(event, endUser.id, rule);
    }
  }

  /**
   * Process a single streak rule for the user
   */
  private async processStreakRule(
    event: RawEventMessage,
    endUserId: string,
    rule: StreakRule,
  ): Promise<void> {
    // Get or create user streak
    const userStreak = await this.userStreakRepository.findOrCreate(
      event.projectId,
      endUserId,
      rule.id,
      rule.defaultFreezeCount,
    );

    // Get activity date from event
    const activityDate = event.timestamp
      ? new Date(event.timestamp)
      : new Date();

    // Process the activity
    const result = await this.userStreakRepository.processActivity(
      userStreak.id,
      activityDate,
      rule.timezoneOffsetMinutes,
    );

    this.logger.debug(
      `Streak ${rule.name} for user: ${result.action}, count ${result.previousCount} -> ${result.newCount}`,
    );

    // Record history based on action
    await this.recordStreakHistory(event, endUserId, rule, userStreak.id, result);

    // Check for milestone achievements
    if (
      result.action === 'extended' ||
      result.action === 'started'
    ) {
      await this.checkMilestones(
        event,
        endUserId,
        rule,
        userStreak.id,
        result.newCount,
        userStreak.lastMilestoneDay,
      );
    }

    // Emit streak events to Kafka
    await this.emitStreakEvent(event, rule, result);
  }

  /**
   * Record streak history based on the action
   */
  private async recordStreakHistory(
    event: RawEventMessage,
    endUserId: string,
    rule: StreakRule,
    userStreakId: string,
    result: {
      action: string;
      newCount: number;
      freezeUsed: boolean;
    },
  ): Promise<void> {
    const baseData = {
      projectId: event.projectId,
      endUserId,
      streakRuleId: rule.id,
      userStreakId,
      streakCount: result.newCount,
      metadata: { eventId: event.event },
    };

    switch (result.action) {
      case 'started':
        await this.streakHistoryRepository.recordStarted(baseData);
        break;
      case 'extended':
        await this.streakHistoryRepository.recordExtension(baseData);
        break;
      case 'frozen':
        await this.streakHistoryRepository.recordFrozen(baseData);
        break;
      case 'broken':
        await this.streakHistoryRepository.recordBroken(baseData);
        break;
    }
  }

  /**
   * Check and award milestone achievements
   */
  private async checkMilestones(
    event: RawEventMessage,
    endUserId: string,
    rule: StreakRule,
    userStreakId: string,
    newStreak: number,
    lastMilestoneDay: number,
  ): Promise<void> {
    const milestone = this.streakRuleRepository.getReachedMilestone(
      rule,
      newStreak,
      lastMilestoneDay,
    );

    if (!milestone) {
      return;
    }

    this.logger.log(
      `User reached ${milestone.day}-day milestone for streak "${rule.name}"!`,
    );

    // Award XP first if configured - if this fails, don't record the milestone
    let xpAwarded = 0;
    if (milestone.rewardXp && milestone.rewardXp > 0) {
      const awarded = await this.awardMilestoneXp(
        event,
        endUserId,
        rule,
        milestone,
      );
      if (!awarded) {
        // XP award failed - don't record milestone to maintain consistency
        this.logger.warn(
          `Skipping milestone recording due to XP award failure for streak "${rule.name}"`,
        );
        return;
      }
      xpAwarded = milestone.rewardXp;
    }

    // Update last milestone day
    await this.userStreakRepository.updateLastMilestoneDay(
      userStreakId,
      milestone.day,
    );

    // Record milestone in history (only after successful XP award)
    await this.streakHistoryRepository.recordMilestone({
      projectId: event.projectId,
      endUserId,
      streakRuleId: rule.id,
      userStreakId,
      streakCount: newStreak,
      milestoneDay: milestone.day,
      xpAwarded,
      metadata: { badgeId: milestone.badgeId },
    });

    // Emit milestone event
    this.emitMilestoneEvent(event, rule, milestone, newStreak);
  }

  /**
   * Award XP for reaching a milestone
   * @returns true if XP was awarded successfully, false otherwise
   */
  private async awardMilestoneXp(
    event: RawEventMessage,
    endUserId: string,
    rule: StreakRule,
    milestone: StreakMilestone,
  ): Promise<boolean> {
    try {
      await this.loyaltyLedgerRepository.addTransaction({
        projectId: event.projectId,
        endUserId,
        amount: milestone.rewardXp,
        type: 'bonus',
        referenceId: rule.id,
        referenceType: 'streak_milestone',
        description: `${milestone.day}-day streak milestone: ${rule.name}`,
      });

      this.logger.log(
        `Awarded ${milestone.rewardXp} XP for ${milestone.day}-day streak milestone`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to award streak milestone XP: ${error}`);
      return false;
    }
  }

  /**
   * Emit streak events to Kafka
   */
  private emitStreakEvent(
    event: RawEventMessage,
    rule: StreakRule,
    result: {
      action: string;
      previousCount: number;
      newCount: number;
      freezeUsed: boolean;
    },
  ): void {
    // Only emit for meaningful actions
    if (result.action === 'same_day') {
      return;
    }

    const eventType = this.getStreakEventType(result.action);
    const streakEvent = {
      projectId: event.projectId,
      userId: event.userId,
      event: eventType,
      properties: {
        streakRuleId: rule.id,
        streakRuleName: rule.name,
        previousCount: result.previousCount,
        currentCount: result.newCount,
        action: result.action,
        freezeUsed: result.freezeUsed,
      },
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', streakEvent);
    this.logger.debug(`Emitted ${eventType} event to Kafka`);
  }

  /**
   * Emit milestone achievement event
   */
  private emitMilestoneEvent(
    event: RawEventMessage,
    rule: StreakRule,
    milestone: StreakMilestone,
    currentStreak: number,
  ): void {
    const milestoneEvent = {
      projectId: event.projectId,
      userId: event.userId,
      event: 'streak.milestone_reached',
      properties: {
        streakRuleId: rule.id,
        streakRuleName: rule.name,
        milestoneDay: milestone.day,
        currentStreak,
        rewardXp: milestone.rewardXp,
        badgeId: milestone.badgeId,
      },
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', milestoneEvent);
    this.logger.debug('Emitted streak.milestone_reached event to Kafka');
  }

  /**
   * Get the event type string for a streak action
   */
  private getStreakEventType(action: string): string {
    switch (action) {
      case 'started':
        return 'streak.started';
      case 'extended':
        return 'streak.extended';
      case 'frozen':
        return 'streak.frozen';
      case 'broken':
        return 'streak.broken';
      default:
        return 'streak.updated';
    }
  }
}
