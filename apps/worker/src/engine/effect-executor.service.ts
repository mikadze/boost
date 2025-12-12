import { Injectable, Logger } from '@nestjs/common';
import {
  LoyaltyLedgerRepository,
  LoyaltyTierRepository,
  EndUserRepository,
} from '@boost/database';
import { RuleEffect, EvaluatedRuleResult, RawEventMessage } from '@boost/common';

export interface EffectExecutionResult {
  ruleId: string;
  campaignId: string;
  effectType: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

@Injectable()
export class EffectExecutorService {
  private readonly logger = new Logger(EffectExecutorService.name);

  constructor(
    private readonly ledgerRepository: LoyaltyLedgerRepository,
    private readonly tierRepository: LoyaltyTierRepository,
    private readonly endUserRepository: EndUserRepository,
  ) {}

  /**
   * Execute all effects from matched rules
   */
  async executeEffects(
    event: RawEventMessage,
    matchedRules: EvaluatedRuleResult[],
  ): Promise<EffectExecutionResult[]> {
    const results: EffectExecutionResult[] = [];

    for (const rule of matchedRules) {
      for (const effect of rule.effects) {
        try {
          const result = await this.executeEffect(event, effect);
          results.push({
            ruleId: rule.ruleId,
            campaignId: rule.campaignId,
            effectType: effect.type,
            success: true,
            result,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to execute effect ${effect.type} for rule ${rule.ruleId}: ${errorMessage}`,
          );
          results.push({
            ruleId: rule.ruleId,
            campaignId: rule.campaignId,
            effectType: effect.type,
            success: false,
            error: errorMessage,
          });
        }
      }
    }

    return results;
  }

  /**
   * Execute a single effect
   */
  private async executeEffect(
    event: RawEventMessage,
    effect: RuleEffect,
  ): Promise<unknown> {
    this.logger.debug(`Executing effect: ${effect.type}`, effect.params);

    switch (effect.type) {
      case 'add_loyalty_points':
        return this.executeAddLoyaltyPoints(event, effect.params);

      case 'upgrade_tier':
        return this.executeUpgradeTier(event, effect.params);

      case 'send_notification':
        return this.executeSendNotification(event, effect.params);

      case 'apply_discount':
      case 'add_item':
      case 'remove_item':
      case 'set_shipping':
      case 'apply_coupon':
      case 'reject_coupon':
        // These are handled synchronously in the Session API
        this.logger.debug(
          `Effect ${effect.type} is handled by Session API, skipping in worker`,
        );
        return { deferred: true, type: effect.type };

      case 'custom':
        return this.executeCustomEffect(event, effect.params);

      default:
        this.logger.warn(`Unknown effect type: ${effect.type}`);
        return { skipped: true, reason: 'unknown_effect_type' };
    }
  }

  /**
   * Add loyalty points to a user
   */
  private async executeAddLoyaltyPoints(
    event: RawEventMessage,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { userId, projectId } = event;
    const points = Number(params.points) || 0;
    const description = String(params.description || 'Points earned from event');
    const referenceType = String(params.referenceType || 'event');

    if (points <= 0) {
      throw new Error('Points must be a positive number');
    }

    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(
      projectId,
      userId,
    );

    // Add loyalty transaction
    const entry = await this.ledgerRepository.addTransaction({
      projectId,
      endUserId: endUser.id,
      amount: points,
      type: 'earn',
      referenceId: event.timestamp,
      referenceType,
      description,
    });

    this.logger.log(
      `Added ${points} loyalty points to user ${userId} (endUserId: ${endUser.id})`,
    );

    // Check for tier upgrade
    await this.checkAndUpgradeTier(projectId, endUser.id);

    return {
      pointsAdded: points,
      newBalance: entry.balance,
      endUserId: endUser.id,
    };
  }

  /**
   * Upgrade user tier
   */
  private async executeUpgradeTier(
    event: RawEventMessage,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { userId, projectId } = event;
    const targetTierId = params.tierId as string | undefined;

    // Find or create end user
    const endUser = await this.endUserRepository.findOrCreate(
      projectId,
      userId,
    );

    if (targetTierId) {
      // Upgrade to specific tier
      const tier = await this.tierRepository.findById(targetTierId);
      if (!tier) {
        throw new Error(`Tier ${targetTierId} not found`);
      }

      await this.endUserRepository.updateTier(endUser.id, targetTierId);
      this.logger.log(`Upgraded user ${userId} to tier ${tier.name}`);

      return {
        previousTierId: endUser.tierId,
        newTierId: targetTierId,
        tierName: tier.name,
      };
    } else {
      // Auto-evaluate tier based on points
      return this.checkAndUpgradeTier(projectId, endUser.id);
    }
  }

  /**
   * Check and upgrade user tier based on points
   */
  private async checkAndUpgradeTier(
    projectId: string,
    endUserId: string,
  ): Promise<unknown> {
    const endUser = await this.endUserRepository.findById(endUserId);
    if (!endUser) {
      throw new Error('End user not found');
    }

    const qualifiedTier = await this.tierRepository.findTierForPoints(
      projectId,
      endUser.loyaltyPoints,
    );

    if (qualifiedTier && qualifiedTier.id !== endUser.tierId) {
      await this.endUserRepository.updateTier(endUserId, qualifiedTier.id);
      this.logger.log(
        `User ${endUser.externalId} upgraded to tier ${qualifiedTier.name} (${endUser.loyaltyPoints} points)`,
      );

      return {
        previousTierId: endUser.tierId,
        newTierId: qualifiedTier.id,
        tierName: qualifiedTier.name,
        tierUpgraded: true,
      };
    }

    return { tierUpgraded: false };
  }

  /**
   * Send notification (placeholder - integrate with notification service)
   */
  private async executeSendNotification(
    event: RawEventMessage,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { userId } = event;
    const { channel, template, data } = params;

    this.logger.log(
      `Would send notification to user ${userId} via ${channel}: ${template}`,
    );

    // TODO: Integrate with actual notification service (email, push, SMS)
    return {
      notificationQueued: true,
      channel,
      template,
      userId,
      data,
    };
  }

  /**
   * Execute custom effect (extensibility point)
   */
  private async executeCustomEffect(
    event: RawEventMessage,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const { action } = params;
    this.logger.debug(`Custom effect action: ${action}`, params);

    // Custom effects can be extended here
    return {
      customEffect: true,
      action,
      params,
    };
  }
}
