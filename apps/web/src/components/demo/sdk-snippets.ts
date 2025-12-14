export interface CodeExample {
  label: string;
  code: string;
  language?: string;
}

export interface FeatureSnippets {
  featureName: string;
  frontend?: CodeExample[];
  backend?: CodeExample[];
}

export const SDK_SNIPPETS = {
  products: {
    featureName: 'Products',
    frontend: [
      {
        label: 'Track product view',
        code: `import { useGamify } from '@gamify/react';

const { track } = useGamify();

// When product is viewed
track('product_viewed', {
  productId: product.id,
  name: product.name,
  price: product.price,
});`,
      },
      {
        label: 'Track add to cart',
        code: `// When user adds item to cart
track('add_to_cart', {
  productId: product.id,
  sku: product.sku,
  name: product.name,
  price: product.price,
  category: product.category,
});`,
      },
    ],
  },

  cart: {
    featureName: 'Cart & Checkout',
    frontend: [
      {
        label: 'Session tracking',
        code: `import { useSession } from '@gamify/react';

const { session, addItem, applyCoupon } = useSession();

// Add item to tracked session
await addItem({
  sku: product.sku,
  name: product.name,
  quantity: 1,
  unitPrice: product.price,
});

// Apply coupon
await applyCoupon('SAVE20');`,
      },
    ],
    backend: [
      {
        label: 'Complete purchase (server-side)',
        code: `import { GamifyClient } from '@gamify/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY!,
});

// Record completed purchase
await gamify.purchase({
  userId: 'user_123',
  orderId: 'order_456',
  amount: 9999, // cents
  currency: 'USD',
  items: [
    { productId: 'prod_1', name: 'Widget', unitPrice: 4999, quantity: 2 }
  ],
});`,
      },
    ],
  },

  loyalty: {
    featureName: 'Loyalty Program',
    frontend: [
      {
        label: 'Fetch loyalty data',
        code: `import { useLoyalty } from '@gamify/react';

const {
  points,
  tier,
  nextTier,
  pointsToNextTier,
  isLoading
} = useLoyalty();

// Display current status
<div>
  <p>{points} points</p>
  <p>Current tier: {tier.name}</p>
  <p>{pointsToNextTier} points to {nextTier?.name}</p>
</div>`,
      },
    ],
  },

  quests: {
    featureName: 'Quests',
    frontend: [
      {
        label: 'Fetch user quests',
        code: `import { useQuests } from '@gamify/react';

const { quests, isLoading } = useQuests();

// quests array contains:
// - id, name, description
// - status: 'not_started' | 'in_progress' | 'completed'
// - percentComplete
// - steps[] with progress`,
      },
    ],
  },

  badges: {
    featureName: 'Achievements',
    frontend: [
      {
        label: 'Fetch user badges',
        code: `import { useBadges } from '@gamify/react';

const { badges, isLoading } = useBadges();

// badges array contains:
// - id, name, description, iconUrl
// - rarity: 'common' | 'rare' | 'epic' | 'legendary'
// - isUnlocked, unlockedAt
// - currentProgress, threshold`,
      },
    ],
  },

  campaigns: {
    featureName: 'Automations',
    frontend: [
      {
        label: 'Fetch campaign triggers',
        code: `import { useCampaigns } from '@gamify/react';

const {
  activeCampaigns,
  myTriggers,
  isLoading
} = useCampaigns();

// myTriggers shows which automations
// have been triggered for current user`,
      },
    ],
  },

  referral: {
    featureName: 'Referral',
    frontend: [
      {
        label: 'Get referral link & set referrer',
        code: `import { useReferral } from '@gamify/react';

const {
  referralCode,
  referralLink,
  setReferrer,
  detectFromUrl,
} = useReferral();

// Set referrer manually
await setReferrer('FRIEND_CODE');

// Or auto-detect from URL (?ref=CODE)
await detectFromUrl();`,
      },
    ],
    backend: [
      {
        label: 'Record successful referral',
        code: `import { GamifyClient } from '@gamify/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY!,
});

// When referred user completes qualifying action
await gamify.referralSuccess({
  referrerId: 'user_123',
  referredUserId: 'user_456',
  rewardType: 'purchase',
  metadata: {
    orderId: 'order_789',
    orderValue: 9999,
  },
});`,
      },
    ],
  },

  affiliateStats: {
    featureName: 'Affiliate Stats',
    frontend: [
      {
        label: 'Fetch affiliate statistics',
        code: `import { useAffiliateStats } from '@gamify/react';

const {
  referralCode,
  referralCount,
  earnings: {
    totalEarned,
    totalPending,
    totalPaid,
  },
  tier,
  isLoading,
} = useAffiliateStats();`,
      },
    ],
  },

  leaderboard: {
    featureName: 'Leaderboard',
    frontend: [
      {
        label: 'Fetch leaderboard',
        code: `import { useLeaderboard } from '@gamify/react';

const {
  entries,
  currentUserRank,
  isLoading,
  refetch,
} = useLeaderboard({ limit: 10 });

// entries[] contains:
// - rank, userId, displayName
// - referralCount, totalEarnings
// - tier info`,
      },
    ],
  },

  userPanel: {
    featureName: 'User Identification',
    frontend: [
      {
        label: 'Identify user',
        code: `import { useIdentify } from '@gamify/react';

const identify = useIdentify();

// Identify user after login
identify('user_123', {
  name: 'John Doe',
  email: 'john@example.com',
  tier: 'Gold',
});`,
      },
    ],
    backend: [
      {
        label: 'Identify user (server-side)',
        code: `import { GamifyClient } from '@gamify/node';

const gamify = new GamifyClient({
  secretKey: process.env.GAMIFY_SECRET_KEY!,
});

// Identify/update user from backend
await gamify.identify({
  userId: 'user_123',
  traits: {
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'premium',
    signupDate: '2024-01-15',
  },
});`,
      },
    ],
  },
} satisfies Record<string, FeatureSnippets>;
