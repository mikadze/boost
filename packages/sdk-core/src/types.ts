/**
 * Configuration options for the Gamify SDK
 */
export interface GamifyConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the API endpoint */
  endpoint?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Flush interval in milliseconds (default: 10000) */
  flushInterval?: number;
  /** Maximum events to batch before auto-flush (default: 10) */
  maxBatchSize?: number;
  /** Storage key prefix (default: 'gamify_') */
  storagePrefix?: string;
}

/**
 * Event payload structure
 */
export interface GamifyEvent {
  /** Event type (e.g., 'page_view', 'click', 'purchase') */
  type: string;
  /** Event properties */
  properties?: Record<string, unknown>;
  /** Timestamp when event occurred */
  timestamp: string;
  /** User ID if identified */
  userId?: string;
  /** Anonymous ID for unidentified users */
  anonymousId: string;
}

/**
 * User traits for identify calls
 */
export interface UserTraits {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Internal queued event with metadata
 */
export interface QueuedEvent {
  id: string;
  event: GamifyEvent;
  attempts: number;
  createdAt: number;
}

/**
 * API response structure
 */
export interface ApiResponse {
  success: boolean;
  error?: string;
}

/**
 * Storage interface for persistence layer
 */
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

// ============================================
// Issue #14: Session Types
// ============================================

/**
 * Cart item structure for sessions
 */
export interface CartItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  brand?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session request to create/update cart
 */
export interface SessionRequest {
  userId: string;
  items: CartItem[];
  coupons?: string[];
  currency?: string;
}

/**
 * Applied effect from rule engine
 */
export interface AppliedEffect {
  type: string;
  ruleId?: string;
  params: Record<string, unknown>;
  discountAmount?: number;
}

/**
 * Session response from API
 */
export interface SessionResponse {
  sessionToken: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupons: string[];
  appliedEffects: AppliedEffect[];
  rejectedCoupons?: string[];
  currency: string;
  status: string;
}

// ============================================
// Issue #15: Loyalty Types
// ============================================

/**
 * Loyalty tier information
 */
export interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  benefits: Record<string, unknown>;
  color?: string | null;
  iconUrl?: string | null;
}

/**
 * Next tier information
 */
export interface NextTierInfo {
  id: string;
  name: string;
  minPoints: number;
  pointsNeeded: number;
}

/**
 * Loyalty summary statistics
 */
export interface LoyaltySummary {
  totalEarned: number;
  totalRedeemed: number;
  transactionCount: number;
}

/**
 * Customer loyalty profile
 */
export interface LoyaltyProfile {
  userId: string;
  points: number;
  tier: LoyaltyTier | null;
  nextTier: NextTierInfo | null;
  summary: LoyaltySummary;
}

/**
 * Loyalty transaction entry
 */
export interface LoyaltyTransaction {
  id: string;
  amount: number;
  balance: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
}

/**
 * Loyalty history response
 */
export interface LoyaltyHistoryResponse {
  transactions: LoyaltyTransaction[];
  total: number;
}

// ============================================
// Issue #22: Affiliate Types
// ============================================

/**
 * Affiliate tier/plan information
 */
export interface AffiliateTier {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

/**
 * Referral information
 */
export interface ReferralInfo {
  id: string;
  referredExternalId: string;
  referralCode: string;
  createdAt: string;
}

/**
 * Affiliate earnings summary
 */
export interface AffiliateEarnings {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  transactionCount: number;
  currency: string;
}

/**
 * Affiliate statistics profile
 */
export interface AffiliateStats {
  userId: string;
  referralCode: string | null;
  referralCount: number;
  earnings: AffiliateEarnings;
  tier: AffiliateTier | null;
}

/**
 * Affiliate stats API response
 */
export interface AffiliateStatsResponse {
  stats: AffiliateStats;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName?: string;
  referralCount: number;
  totalEarnings: number;
  tier?: AffiliateTier | null;
}

/**
 * Leaderboard response
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  currentUserRank?: number;
}

// ============================================
// Issue #25-28: Quest Types
// ============================================

/**
 * Quest step definition
 */
export interface QuestStep {
  id: string;
  name: string;
  description?: string;
  eventName: string;
  requiredCount: number;
  order: number;
  currentCount: number;
  completed: boolean;
}

/**
 * Quest with user progress
 */
export interface QuestWithProgress {
  id: string;
  name: string;
  description?: string;
  xpReward: number;
  badgeReward?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  percentComplete: number;
  steps: QuestStep[];
  startedAt?: string;
  completedAt?: string;
}

/**
 * Quests response from API
 */
export interface QuestsResponse {
  quests: QuestWithProgress[];
}

// ============================================
// Issue #32: Streak Types
// ============================================

/**
 * Streak milestone definition
 */
export interface StreakMilestone {
  day: number;
  rewardXp: number;
  badgeId?: string;
  reached: boolean;
}

/**
 * User streak with progress
 */
export interface StreakWithProgress {
  id: string;
  name: string;
  description?: string;
  eventType: string;
  frequency: string;
  currentCount: number;
  maxStreak: number;
  status: string;
  lastActivityDate?: string;
  freezeInventory: number;
  freezeUsedToday: boolean;
  nextMilestone?: {
    day: number;
    rewardXp: number;
    badgeId?: string;
  };
  milestones: StreakMilestone[];
}

/**
 * Streaks response from API
 */
export interface StreaksResponse {
  streaks: StreakWithProgress[];
  stats: {
    totalActive: number;
    longestCurrent: number;
    longestEver: number;
  };
}

/**
 * Freeze response
 */
export interface FreezeResponse {
  success: boolean;
  remainingFreezes: number;
  message: string;
}

// ============================================
// Issue #33: Badge Types
// ============================================

/**
 * Badge rarity levels
 */
export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

/**
 * Badge with unlock status
 */
export interface BadgeWithStatus {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
  rarity: BadgeRarity;
  visibility: 'PUBLIC' | 'HIDDEN';
  category?: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

/**
 * Badges response from API
 */
export interface BadgesResponse {
  badges: BadgeWithStatus[];
  stats: {
    total: number;
    unlocked: number;
    byRarity: Record<string, { total: number; unlocked: number }>;
  };
}

// ============================================
// Issue #34: Rewards Types
// ============================================

/**
 * Reward item from store
 */
export interface RewardItem {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  imageUrl?: string;
  category?: string;
  stock?: number;
  requiredBadgeId?: string;
  requiredBadgeName?: string;
  canAfford: boolean;
  hasBadge: boolean;
  isAvailable: boolean;
}

/**
 * Rewards store response
 */
export interface RewardsStoreResponse {
  items: RewardItem[];
  userPoints: number;
}

/**
 * Redemption result
 */
export interface RedemptionResult {
  success: boolean;
  transactionId?: string;
  message: string;
  remainingPoints?: number;
}
