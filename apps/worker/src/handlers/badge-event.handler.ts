import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RawEventMessage } from '@boost/common';
import {
  BadgeDefinitionRepository,
  UserBadgeRepository,
  EndUserRepository,
  BadgeDefinition,
} from '@boost/database';
import { EventHandler } from './event-handler.interface';

/**
 * Badge Event Handler (Story 3.2: Smart Badge Processor)
 *
 * Implements intelligent badge evaluation logic:
 * 1. Listens for events that could trigger badge awards
 * 2. Filters badges by triggering metric (not all badges)
 * 3. Checks threshold eligibility
 * 4. Awards badge with idempotency (user can only earn each badge once)
 * 5. Emits badge.unlocked event for notifications
 *
 * Uses Redis metric mapping for O(1) complexity rather than checking all badges.
 */
@Injectable()
export class BadgeEventHandler implements EventHandler {
  private readonly logger = new Logger(BadgeEventHandler.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
    private readonly badgeDefinitionRepository: BadgeDefinitionRepository,
    private readonly userBadgeRepository: UserBadgeRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  /**
   * This handler processes badge evaluation events.
   * Returns special marker - actual matching happens at runtime based on trigger metric.
   */
  getSupportedTypes(): string[] {
    return ['__badge_evaluation__'];
  }

  /**
   * Check if this event should trigger badge evaluation
   */
  async shouldHandle(event: RawEventMessage): Promise<boolean> {
    if (!event.userId) {
      return false;
    }

    // Extract metric from event (e.g., 'purchase' from 'purchase.completed')
    const metricName = this.extractMetricFromEvent(event.event);
    if (!metricName) {
      return false;
    }

    // Check if there are any active badges with this trigger metric
    const matchingBadges = await this.badgeDefinitionRepository.findByTriggerMetric(
      event.projectId,
      metricName,
    );

    return matchingBadges.length > 0;
  }

  async handle(event: RawEventMessage): Promise<void> {
    this.logger.debug(`Evaluating badges for event: ${event.event}`);

    const userId = event.userId;
    if (!userId) {
      this.logger.debug('No userId in event, skipping badge evaluation');
      return;
    }

    // Find the end user record
    const endUser = await this.endUserRepository.findByExternalId(event.projectId, userId);
    if (!endUser) {
      this.logger.debug(`End user ${userId} not found, skipping badge evaluation`);
      return;
    }

    // Extract metric from event
    const metricName = this.extractMetricFromEvent(event.event);
    if (!metricName) {
      this.logger.debug(`Could not extract metric from event: ${event.event}`);
      return;
    }

    // Find all active badges with this trigger metric
    const matchingBadges = await this.badgeDefinitionRepository.findByTriggerMetric(
      event.projectId,
      metricName,
    );

    if (matchingBadges.length === 0) {
      this.logger.debug(`No badges match metric: ${metricName}`);
      return;
    }

    this.logger.debug(`Found ${matchingBadges.length} badges matching metric: ${metricName}`);

    // Get metric value from event properties
    const metricValue = this.extractMetricValue(event);

    // Process each matching badge
    for (const badge of matchingBadges) {
      await this.processBadge(event, endUser.id, badge, metricValue);
    }
  }

  /**
   * Extract metric name from event type
   * e.g., 'purchase.completed' -> 'purchase'
   * e.g., 'referral.success' -> 'referral'
   */
  private extractMetricFromEvent(eventType: string): string | null {
    // Split by dot and take first part as metric
    const parts = eventType.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
    return eventType || null;
  }

  /**
   * Extract metric value from event properties
   * Looks for common value fields: count, amount, total, value
   */
  private extractMetricValue(event: RawEventMessage): number {
    const props = event.properties || {};

    // Check common value fields
    const valueFields = ['count', 'amount', 'total', 'value', 'quantity'];
    for (const field of valueFields) {
      if (typeof props[field] === 'number') {
        return props[field] as number;
      }
    }

    // Default to 1 for event count based badges
    return 1;
  }

  /**
   * Process a single badge evaluation for a user
   */
  private async processBadge(
    event: RawEventMessage,
    endUserId: string,
    badge: BadgeDefinition,
    metricValue: number,
  ): Promise<void> {
    // Check if user already has this badge (idempotency)
    const alreadyHasBadge = await this.userBadgeRepository.hasBadge(endUserId, badge.id);
    if (alreadyHasBadge) {
      this.logger.debug(`User already has badge ${badge.id}, skipping`);
      return;
    }

    // Check badge rule type
    switch (badge.ruleType) {
      case 'METRIC_THRESHOLD':
        await this.evaluateThresholdBadge(event, endUserId, badge, metricValue);
        break;
      case 'EVENT_COUNT':
        await this.evaluateEventCountBadge(event, endUserId, badge);
        break;
      case 'MANUAL':
        // Manual badges are not auto-awarded
        this.logger.debug(`Badge ${badge.id} is manual, skipping auto-award`);
        break;
      default:
        this.logger.warn(`Unknown badge rule type: ${badge.ruleType}`);
    }
  }

  /**
   * Evaluate threshold-based badge
   */
  private async evaluateThresholdBadge(
    event: RawEventMessage,
    endUserId: string,
    badge: BadgeDefinition,
    metricValue: number,
  ): Promise<void> {
    if (!badge.threshold) {
      this.logger.warn(`Badge ${badge.id} has no threshold configured`);
      return;
    }

    if (metricValue >= badge.threshold) {
      await this.awardBadge(event, endUserId, badge, {
        triggerValue: metricValue,
        threshold: badge.threshold,
        triggerEvent: event.event,
      });
    } else {
      this.logger.debug(
        `Metric value ${metricValue} below threshold ${badge.threshold} for badge ${badge.id}`,
      );
    }
  }

  /**
   * Evaluate event count-based badge
   * For this, we would typically track event counts in a separate table or Redis
   * For now, simplified to check threshold against current event count
   */
  private async evaluateEventCountBadge(
    event: RawEventMessage,
    endUserId: string,
    badge: BadgeDefinition,
  ): Promise<void> {
    // Event count badges need cumulative tracking
    // The event properties should contain the cumulative count
    const count = this.extractMetricValue(event);

    if (!badge.threshold) {
      this.logger.warn(`Badge ${badge.id} has no threshold configured`);
      return;
    }

    if (count >= badge.threshold) {
      await this.awardBadge(event, endUserId, badge, {
        triggerCount: count,
        threshold: badge.threshold,
        triggerEvent: event.event,
      });
    }
  }

  /**
   * Award badge to user
   */
  private async awardBadge(
    event: RawEventMessage,
    endUserId: string,
    badge: BadgeDefinition,
    triggerMetadata: Record<string, unknown>,
  ): Promise<void> {
    const userBadge = await this.userBadgeRepository.awardBadge({
      projectId: event.projectId,
      endUserId,
      badgeId: badge.id,
      awardSource: 'AUTOMATIC',
      metadata: {
        badgeSnapshot: {
          name: badge.name,
          rarity: badge.rarity,
          category: badge.category,
        },
        ...triggerMetadata,
      },
    });

    if (!userBadge) {
      // User already has badge (race condition handled)
      this.logger.debug(`User already has badge ${badge.id} (race condition)`);
      return;
    }

    this.logger.log(`Awarded badge "${badge.name}" to user ${event.userId}`);

    // Emit badge.unlocked event for notifications (Story 3.5)
    this.emitBadgeUnlockedEvent(event, badge, userBadge.unlockedAt);
  }

  /**
   * Emit badge.unlocked event to Kafka
   */
  private emitBadgeUnlockedEvent(
    event: RawEventMessage,
    badge: BadgeDefinition,
    unlockedAt: Date,
  ): void {
    const badgeUnlockedEvent = {
      projectId: event.projectId,
      userId: event.userId,
      event: 'badge.unlocked',
      properties: {
        badgeId: badge.id,
        badgeName: badge.name,
        rarity: badge.rarity,
        visibility: badge.visibility,
        category: badge.category,
        iconUrl: badge.iconUrl,
        imageUrl: badge.imageUrl,
      },
      timestamp: unlockedAt.toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.kafkaClient.emit('raw-events', badgeUnlockedEvent);
    this.logger.debug(`Emitted badge.unlocked event to Kafka for badge ${badge.id}`);
  }
}
