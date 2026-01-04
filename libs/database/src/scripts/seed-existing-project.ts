/**
 * One-time script to seed an existing project with sample data
 *
 * Usage: npx tsx libs/database/src/scripts/seed-existing-project.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import {
  SEED_QUESTS,
  SEED_LOYALTY_TIERS,
  SEED_COMMISSION_PLANS,
  SEED_BADGES,
} from '../seeds/project-seed-data';

// Existing production project ID
const PROJECT_ID = '07516e81-32fd-4699-9e1f-f8402fd87cab';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  try {
    console.log(`Seeding project ${PROJECT_ID}...`);

    // Seed quests
    console.log(`Creating ${SEED_QUESTS.length} quests...`);
    for (const questData of SEED_QUESTS) {
      const [quest] = await db
        .insert(schema.questDefinitions)
        .values({
          projectId: PROJECT_ID,
          name: questData.name,
          description: questData.description,
          rewardXp: questData.rewardXp,
          active: questData.active,
        })
        .returning();

      if (quest && questData.steps.length > 0) {
        await db.insert(schema.questSteps).values(
          questData.steps.map((step) => ({
            questId: quest.id,
            projectId: PROJECT_ID,
            eventName: step.eventName,
            requiredCount: step.requiredCount,
            orderIndex: step.orderIndex,
            title: step.title,
            description: step.description,
          })),
        );
      }
    }

    // Seed loyalty tiers
    console.log(`Creating ${SEED_LOYALTY_TIERS.length} loyalty tiers...`);
    for (const tierData of SEED_LOYALTY_TIERS) {
      await db.insert(schema.loyaltyTiers).values({
        projectId: PROJECT_ID,
        name: tierData.name,
        minPoints: tierData.minPoints,
        level: tierData.level,
        color: tierData.color,
        benefits: tierData.benefits,
      });
    }

    // Seed commission plans
    console.log(`Creating ${SEED_COMMISSION_PLANS.length} commission plans...`);
    for (const planData of SEED_COMMISSION_PLANS) {
      await db.insert(schema.commissionPlans).values({
        projectId: PROJECT_ID,
        name: planData.name,
        description: planData.description,
        type: planData.type,
        value: planData.value,
        isDefault: planData.isDefault,
        active: true,
      });
    }

    // Seed badges
    console.log(`Creating ${SEED_BADGES.length} badges...`);
    for (const badgeData of SEED_BADGES) {
      await db.insert(schema.badgeDefinitions).values({
        projectId: PROJECT_ID,
        name: badgeData.name,
        description: badgeData.description,
        rarity: badgeData.rarity,
        category: badgeData.category,
        triggerMetric: badgeData.triggerMetric,
        threshold: badgeData.threshold,
        active: true,
      });
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding project:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
