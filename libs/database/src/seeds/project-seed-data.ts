/**
 * Sample seed data for new projects
 * Based on demo component mock data
 */

export interface SeedQuestStep {
  title: string;
  description?: string;
  eventName: string;
  requiredCount: number;
  orderIndex: number;
}

export interface SeedQuest {
  name: string;
  description: string;
  rewardXp: number;
  active: boolean;
  steps: SeedQuestStep[];
}

export interface SeedLoyaltyTier {
  name: string;
  minPoints: number;
  level: number;
  color: string;
  benefits: string[];
}

export interface SeedCommissionPlan {
  name: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // basis points for percentage (500 = 5%), cents for fixed
  isDefault: boolean;
}

export interface SeedBadge {
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  category: string;
  triggerMetric: string;
  threshold: number;
}

// ===========================================
// QUESTS
// ===========================================

export const SEED_QUESTS: SeedQuest[] = [
  {
    name: 'Welcome Journey',
    description: 'Complete your first steps and earn rewards',
    rewardXp: 500,
    active: true,
    steps: [
      { title: 'Sign Up', description: 'Create your account', eventName: 'user_signup', requiredCount: 1, orderIndex: 1 },
      { title: 'Complete Profile', description: 'Fill in your profile details', eventName: 'profile_completed', requiredCount: 1, orderIndex: 2 },
      { title: 'Browse Products', description: 'View 5 products', eventName: 'product_viewed', requiredCount: 5, orderIndex: 3 },
      { title: 'Add to Cart', description: 'Add an item to your cart', eventName: 'add_to_cart', requiredCount: 1, orderIndex: 4 },
      { title: 'Make a Purchase', description: 'Complete your first purchase', eventName: 'purchase', requiredCount: 1, orderIndex: 5 },
    ],
  },
  {
    name: 'Social Butterfly',
    description: 'Share with friends and earn extra rewards',
    rewardXp: 300,
    active: true,
    steps: [
      { title: 'Share a Product', description: 'Share a product on social media', eventName: 'product_shared', requiredCount: 1, orderIndex: 1 },
      { title: 'Refer a Friend', description: 'Send a referral invitation', eventName: 'referral_sent', requiredCount: 1, orderIndex: 2 },
    ],
  },
  {
    name: 'Power Shopper',
    description: 'Become a loyal customer with multiple purchases',
    rewardXp: 1000,
    active: true,
    steps: [
      { title: 'Make 5 Purchases', description: 'Complete 5 orders', eventName: 'purchase', requiredCount: 5, orderIndex: 1 },
      { title: 'Spend $500', description: 'Reach $500 in total spending', eventName: 'spending_milestone', requiredCount: 50000, orderIndex: 2 },
    ],
  },
  {
    name: 'VIP Status',
    description: 'Achieve elite status through engagement',
    rewardXp: 2000,
    active: true,
    steps: [
      { title: 'Upgrade Tier', description: 'Reach a higher loyalty tier', eventName: 'tier_upgraded', requiredCount: 1, orderIndex: 1 },
      { title: 'Refer 3 Friends', description: 'Successfully refer 3 friends', eventName: 'referral_success', requiredCount: 3, orderIndex: 2 },
      { title: 'Leave 5 Reviews', description: 'Write reviews for 5 products', eventName: 'review_submitted', requiredCount: 5, orderIndex: 3 },
    ],
  },
];

// ===========================================
// LOYALTY TIERS
// ===========================================

export const SEED_LOYALTY_TIERS: SeedLoyaltyTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    level: 1,
    color: '#CD7F32',
    benefits: ['5% back on purchases'],
  },
  {
    name: 'Silver',
    minPoints: 1000,
    level: 2,
    color: '#C0C0C0',
    benefits: ['10% back on purchases', 'Free shipping'],
  },
  {
    name: 'Gold',
    minPoints: 5000,
    level: 3,
    color: '#FFD700',
    benefits: ['15% back on purchases', 'Free shipping', 'Early access to sales'],
  },
  {
    name: 'Platinum',
    minPoints: 10000,
    level: 4,
    color: '#E5E4E2',
    benefits: ['20% back on purchases', 'Free shipping', 'Early access to sales', 'VIP support'],
  },
];

// ===========================================
// COMMISSION PLANS (Affiliate Tiers)
// ===========================================

export const SEED_COMMISSION_PLANS: SeedCommissionPlan[] = [
  {
    name: 'Starter',
    description: 'Entry-level affiliate program',
    type: 'PERCENTAGE',
    value: 500, // 5%
    isDefault: true,
  },
  {
    name: 'Pro',
    description: 'Professional affiliate with increased commission',
    type: 'PERCENTAGE',
    value: 1000, // 10%
    isDefault: false,
  },
  {
    name: 'Elite',
    description: 'Top-tier affiliate with maximum commission',
    type: 'PERCENTAGE',
    value: 1500, // 15%
    isDefault: false,
  },
];

// ===========================================
// BADGES
// ===========================================

export const SEED_BADGES: SeedBadge[] = [
  {
    name: 'Early Bird',
    description: 'Create your first account',
    rarity: 'COMMON',
    category: 'Onboarding',
    triggerMetric: 'account_created',
    threshold: 1,
  },
  {
    name: 'Window Shopper',
    description: 'View 10 products',
    rarity: 'COMMON',
    category: 'Engagement',
    triggerMetric: 'products_viewed',
    threshold: 10,
  },
  {
    name: 'First Purchase',
    description: 'Complete your first purchase',
    rarity: 'RARE',
    category: 'Purchase',
    triggerMetric: 'purchases_made',
    threshold: 1,
  },
  {
    name: 'Loyal Customer',
    description: 'Make 10 purchases',
    rarity: 'EPIC',
    category: 'Purchase',
    triggerMetric: 'purchases_made',
    threshold: 10,
  },
  {
    name: 'Social Star',
    description: 'Refer 5 friends',
    rarity: 'EPIC',
    category: 'Social',
    triggerMetric: 'referrals_made',
    threshold: 5,
  },
  {
    name: 'VIP Legend',
    description: 'Reach Gold tier status',
    rarity: 'LEGENDARY',
    category: 'Status',
    triggerMetric: 'tier_reached',
    threshold: 3,
  },
];
