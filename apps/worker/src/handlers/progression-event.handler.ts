import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RawEventMessage } from '@boost/common';
import {
  ProgressionRuleRepository,
  CommissionLedgerRepository,
  ReferralTrackingRepository,
  EndUserRepository,
  CommissionPlanRepository,
} from '@boost/database';
import { EventHandler } from './event-handler.interface';

/**
 * Progression Event Handler
 *
 * Implements the "Level Up" logic for gamified progression:
 * 1. Triggers after stat-affecting events (referral success, purchase processed)
 * 2. Fetches user stats and applicable progression rules
 * 3. Evaluates thresholds
 * 4. Updates commissionPlanId when conditions are met
 * 5. Emits user.leveled_up event to Kafka
 *
 * Includes idempotency protection to prevent duplicate upgrades
 */
@Injectable()
export class ProgressionEventHandler implements EventHandler {
  private readonly logger = new Logger(ProgressionEventHandler.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly progressionRuleRepository: ProgressionRuleRepository,
    private readonly commissionLedgerRepository: CommissionLedgerRepository,
    private readonly referralTrackingRepository: ReferralTrackingRepository,
    private readonly endUserRepository: EndUserRepository,
    private readonly commissionPlanRepository: CommissionPlanRepository,
  ) {}

  /**
   * Event types that can trigger progression evaluation
   *
   * Note: We listen for 'commission.created' instead of 'purchase'/'checkout_success'
   * to ensure the commission ledger entry exists before calculating stats.
   * The PurchaseEventHandler emits 'commission.created' after creating the ledger entry.
   */
  getSupportedTypes(): string[] {
    // Trigger on events that affect user stats
    return [
      'user_signup',
      'referral_success',
      'commission.created', // Emitted by PurchaseEventHandler after ledger entry creation
    ];
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Evaluating progression for event: ${event.event}`);

    // Get the user who triggered this event
    const userId = event.userId;
    if (!userId) {
      this.logger.debug('No userId in event, skipping progression evaluation');
      return;
    }

    // Find the end user record
    const endUser = await this.endUserRepository.findByExternalId(event.projectId, userId);
    if (!endUser) {
      this.logger.debug(`End user ${userId} not found, skipping progression evaluation`);
      return;
    }

    // Get all active progression rules for this project
    const rules = await this.progressionRuleRepository.findActiveByProjectId(event.projectId);
    if (rules.length === 0) {
      this.logger.debug('No active progression rules, skipping evaluation');
      return;
    }

    // Calculate user stats based on different metrics
    const stats = await this.calculateUserStats(endUser.id);

    // Evaluate each rule and find the best matching one
    let bestMatchingRule = null;
    let bestMatchingThreshold = -1;

    for (const rule of rules) {
      const metricValue = stats[rule.triggerMetric];
      if (metricValue === undefined) {
        continue;
      }

      // Check if threshold is met and this rule has a higher threshold than current best
      if (metricValue >= rule.threshold && rule.threshold > bestMatchingThreshold) {
        // Idempotency check: skip if already on this plan
        if (endUser.commissionPlanId === rule.actionTargetPlanId) {
          continue;
        }

        bestMatchingRule = rule;
        bestMatchingThreshold = rule.threshold;
      }
    }

    if (!bestMatchingRule) {
      this.logger.debug('No progression rules matched');
      return;
    }

    // Get target plan details for logging
    const targetPlan = await this.commissionPlanRepository.findById(bestMatchingRule.actionTargetPlanId);
    if (!targetPlan) {
      this.logger.warn(`Target plan ${bestMatchingRule.actionTargetPlanId} not found`);
      return;
    }

    // Update user's commission plan
    await this.endUserRepository.update(endUser.id, {
      commissionPlanId: bestMatchingRule.actionTargetPlanId,
    });

    this.logger.log(
      `User ${userId} leveled up to "${targetPlan.name}" plan ` +
      `(rule: ${bestMatchingRule.name}, metric: ${bestMatchingRule.triggerMetric} >= ${bestMatchingRule.threshold})`,
    );

    // Emit user.leveled_up event to Kafka
    const levelUpEvent = {
      projectId: event.projectId,
      userId: endUser.externalId,
      event: 'user.leveled_up',
      properties: {
        previousPlanId: endUser.commissionPlanId,
        newPlanId: targetPlan.id,
        newPlanName: targetPlan.name,
        ruleName: bestMatchingRule.name,
        triggerMetric: bestMatchingRule.triggerMetric,
        thresholdReached: bestMatchingThreshold,
        stats,
      },
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', levelUpEvent);
    this.logger.debug('Emitted user.leveled_up event to Kafka');
  }

  /**
   * Calculate user stats for progression evaluation
   */
  private async calculateUserStats(endUserId: string): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    // Referral count
    const referralCount = await this.referralTrackingRepository.countByReferrerId(endUserId);
    stats['referral_count'] = referralCount;
    stats['referrals'] = referralCount; // Alias

    // Commission stats
    const commissionSummary = await this.commissionLedgerRepository.getSummaryByEndUser(endUserId);
    stats['total_earnings'] = commissionSummary.totalEarned;
    stats['total_paid'] = commissionSummary.totalPaid;
    stats['total_pending'] = commissionSummary.totalPending;
    stats['commission_count'] = commissionSummary.transactionCount;

    return stats;
  }
}
