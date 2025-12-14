/**
 * @gamify/react - React SDK for Gamify event tracking
 * @packageDocumentation
 */

// Context and Provider
export { GamifyProvider, type GamifyProviderProps, type GamifyContextValue } from './context.js';

// Hooks
export {
  useGamify,
  useTrack,
  useIdentify,
  useSession,
  useLoyalty,
  // Issue #22: Affiliate hooks
  useReferral,
  useAffiliateStats,
  useLeaderboard,
  // Gamification hooks
  useQuests,
  useStreaks,
  useBadges,
  useRewards,
} from './hooks.js';

// Components
export {
  GamifyPageView,
  GamifyTrackClick,
  type GamifyPageViewProps,
  type GamifyTrackClickProps,
  // Issue #23: Affiliate UI Components
  AffiliateStats,
  Leaderboard,
  ReferralLink,
  type AffiliateStatsProps,
  type LeaderboardProps,
  type ReferralLinkProps,
  // Issue #25-34: Gamification Components
  QuestProgress,
  StreakFlame,
  BadgeGrid,
  LevelProgress,
  RewardStore,
  type QuestProgressProps,
  type StreakFlameProps,
  type BadgeGridProps,
  type LevelProgressProps,
  type RewardStoreProps,
} from './components.js';

// Re-export core types for convenience
export type {
  GamifyConfig,
  GamifyEvent,
  UserTraits,
  // Session types
  CartItem,
  SessionResponse,
  AppliedEffect,
  // Loyalty types
  LoyaltyProfile,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltyHistoryResponse,
  // Issue #22: Affiliate types
  AffiliateTier,
  AffiliateEarnings,
  AffiliateStats as AffiliateStatsData,
  LeaderboardEntry,
  LeaderboardResponse,
  // Gamification types
  QuestWithProgress,
  QuestStep,
  QuestsResponse,
  StreakWithProgress,
  StreakMilestone,
  StreaksResponse,
  FreezeResponse,
  BadgeWithStatus,
  BadgeRarity,
  BadgesResponse,
  RewardItem,
  RewardsStoreResponse,
  RedemptionResult,
} from '@gamify/core';
