import { Module, Global, DynamicModule } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { EventRepository } from './repositories/event.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { ProjectRepository } from './repositories/project.repository';
// Issue #13: Rule Engine Repositories
import { AttributeRepository } from './repositories/attribute.repository';
import { CampaignRepository } from './repositories/campaign.repository';
import { RuleRepository } from './repositories/rule.repository';
// Issue #14: Promotion Toolkit Repositories
import { CustomerSessionRepository } from './repositories/customer-session.repository';
import { CouponRepository } from './repositories/coupon.repository';
// Issue #15: Loyalty Repositories
import { LoyaltyTierRepository } from './repositories/loyalty-tier.repository';
import { LoyaltyLedgerRepository } from './repositories/loyalty-ledger.repository';
import { EndUserRepository } from './repositories/end-user.repository';
// Issue #20: Monetization Repositories
import { CommissionPlanRepository } from './repositories/commission-plan.repository';
import { CommissionLedgerRepository } from './repositories/commission-ledger.repository';
import { ReferralTrackingRepository } from './repositories/referral-tracking.repository';
// Issue #21: Progression Engine Repository
import { ProgressionRuleRepository } from './repositories/progression-rule.repository';
// Issue #25: Quest Engine Repositories
import { QuestDefinitionRepository } from './repositories/quest-definition.repository';
import { QuestStepRepository } from './repositories/quest-step.repository';
import { UserQuestProgressRepository } from './repositories/user-quest-progress.repository';
import { UserStepProgressRepository } from './repositories/user-step-progress.repository';
// Issue #33: Badge System Repositories
import { BadgeDefinitionRepository } from './repositories/badge-definition.repository';
import { UserBadgeRepository } from './repositories/user-badge.repository';

let pool: Pool;

export function initializePool(connectionString: string) {
  if (!pool) {
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
}

export function getPool() {
  return pool;
}

export function getDrizzleClient() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool first.');
  }
  return drizzle(pool, { schema });
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(connectionString: string): DynamicModule {
    initializePool(connectionString);

    const repositories = [
      ApiKeyRepository,
      EventRepository,
      OrganizationRepository,
      ProjectRepository,
      // Issue #13
      AttributeRepository,
      CampaignRepository,
      RuleRepository,
      // Issue #14
      CustomerSessionRepository,
      CouponRepository,
      // Issue #15
      LoyaltyTierRepository,
      LoyaltyLedgerRepository,
      EndUserRepository,
      // Issue #20
      CommissionPlanRepository,
      CommissionLedgerRepository,
      ReferralTrackingRepository,
      // Issue #21
      ProgressionRuleRepository,
      // Issue #25
      QuestDefinitionRepository,
      QuestStepRepository,
      UserQuestProgressRepository,
      UserStepProgressRepository,
      // Issue #33
      BadgeDefinitionRepository,
      UserBadgeRepository,
    ];

    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DRIZZLE_CONNECTION',
          useFactory: () => getDrizzleClient(),
        },
        {
          provide: 'DB_POOL',
          useFactory: () => pool,
        },
        ...repositories,
      ],
      exports: ['DRIZZLE_CONNECTION', 'DB_POOL', ...repositories],
    };
  }

  static forRootAsync(options: {
    inject: any[];
    useFactory: (...args: any[]) => string | Promise<string>;
  }): DynamicModule {
    const repositories = [
      ApiKeyRepository,
      EventRepository,
      OrganizationRepository,
      ProjectRepository,
      // Issue #13
      AttributeRepository,
      CampaignRepository,
      RuleRepository,
      // Issue #14
      CustomerSessionRepository,
      CouponRepository,
      // Issue #15
      LoyaltyTierRepository,
      LoyaltyLedgerRepository,
      EndUserRepository,
      // Issue #20
      CommissionPlanRepository,
      CommissionLedgerRepository,
      ReferralTrackingRepository,
      // Issue #21
      ProgressionRuleRepository,
      // Issue #25
      QuestDefinitionRepository,
      QuestStepRepository,
      UserQuestProgressRepository,
      UserStepProgressRepository,
      // Issue #33
      BadgeDefinitionRepository,
      UserBadgeRepository,
    ];

    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DRIZZLE_CONNECTION',
          inject: options.inject,
          useFactory: async (...args: any[]) => {
            const connectionString = await options.useFactory(...args);
            initializePool(connectionString);
            return getDrizzleClient();
          },
        },
        {
          provide: 'DB_POOL',
          inject: ['DRIZZLE_CONNECTION'],
          useFactory: () => pool,
        },
        ...repositories,
      ],
      exports: ['DRIZZLE_CONNECTION', 'DB_POOL', ...repositories],
    };
  }
}
