import { Injectable, Logger } from '@nestjs/common';
import { QuestDefinitionRepository } from '../repositories/quest-definition.repository';
import { QuestStepRepository } from '../repositories/quest-step.repository';
import { LoyaltyTierRepository } from '../repositories/loyalty-tier.repository';
import { CommissionPlanRepository } from '../repositories/commission-plan.repository';
import { BadgeDefinitionRepository } from '../repositories/badge-definition.repository';
import {
  SEED_QUESTS,
  SEED_LOYALTY_TIERS,
  SEED_COMMISSION_PLANS,
  SEED_BADGES,
} from './project-seed-data';

@Injectable()
export class ProjectSeederService {
  private readonly logger = new Logger(ProjectSeederService.name);

  constructor(
    private readonly questDefinitionRepo: QuestDefinitionRepository,
    private readonly questStepRepo: QuestStepRepository,
    private readonly loyaltyTierRepo: LoyaltyTierRepository,
    private readonly commissionPlanRepo: CommissionPlanRepository,
    private readonly badgeDefinitionRepo: BadgeDefinitionRepository,
  ) {}

  /**
   * Seeds a project with sample data (quests, tiers, badges, commission plans)
   */
  async seedProject(projectId: string): Promise<void> {
    this.logger.log(`Seeding project ${projectId} with sample data...`);

    try {
      await Promise.all([
        this.seedQuests(projectId),
        this.seedLoyaltyTiers(projectId),
        this.seedCommissionPlans(projectId),
        this.seedBadges(projectId),
      ]);

      this.logger.log(`Successfully seeded project ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to seed project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Seeds quests with their steps
   */
  private async seedQuests(projectId: string): Promise<void> {
    this.logger.debug(`Seeding ${SEED_QUESTS.length} quests...`);

    for (const questData of SEED_QUESTS) {
      // Create the quest definition
      const quest = await this.questDefinitionRepo.create({
        projectId,
        name: questData.name,
        description: questData.description,
        rewardXp: questData.rewardXp,
        active: questData.active,
      });

      // Create the quest steps
      if (questData.steps.length > 0) {
        await this.questStepRepo.createMany(
          questData.steps.map((step) => ({
            questId: quest.id,
            projectId,
            eventName: step.eventName,
            requiredCount: step.requiredCount,
            orderIndex: step.orderIndex,
            title: step.title,
            description: step.description,
          })),
        );
      }
    }

    this.logger.debug(`Seeded ${SEED_QUESTS.length} quests`);
  }

  /**
   * Seeds loyalty tiers
   */
  private async seedLoyaltyTiers(projectId: string): Promise<void> {
    this.logger.debug(`Seeding ${SEED_LOYALTY_TIERS.length} loyalty tiers...`);

    for (const tierData of SEED_LOYALTY_TIERS) {
      await this.loyaltyTierRepo.create({
        projectId,
        name: tierData.name,
        minPoints: tierData.minPoints,
        level: tierData.level,
        color: tierData.color,
        benefits: tierData.benefits,
      });
    }

    this.logger.debug(`Seeded ${SEED_LOYALTY_TIERS.length} loyalty tiers`);
  }

  /**
   * Seeds commission plans (affiliate tiers)
   */
  private async seedCommissionPlans(projectId: string): Promise<void> {
    this.logger.debug(`Seeding ${SEED_COMMISSION_PLANS.length} commission plans...`);

    for (const planData of SEED_COMMISSION_PLANS) {
      await this.commissionPlanRepo.create({
        projectId,
        name: planData.name,
        description: planData.description,
        type: planData.type,
        value: planData.value,
        isDefault: planData.isDefault,
        active: true,
      });
    }

    this.logger.debug(`Seeded ${SEED_COMMISSION_PLANS.length} commission plans`);
  }

  /**
   * Seeds badges
   */
  private async seedBadges(projectId: string): Promise<void> {
    this.logger.debug(`Seeding ${SEED_BADGES.length} badges...`);

    for (const badgeData of SEED_BADGES) {
      await this.badgeDefinitionRepo.create({
        projectId,
        name: badgeData.name,
        description: badgeData.description,
        rarity: badgeData.rarity,
        category: badgeData.category,
        triggerMetric: badgeData.triggerMetric,
        threshold: badgeData.threshold,
        active: true,
      });
    }

    this.logger.debug(`Seeded ${SEED_BADGES.length} badges`);
  }
}
