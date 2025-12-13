/**
 * @gamify/core - Framework-agnostic TypeScript SDK for event tracking
 * @packageDocumentation
 */

export { Gamify } from './gamify.js';

export type {
  GamifyConfig,
  GamifyEvent,
  UserTraits,
  QueuedEvent,
  ApiResponse,
  StorageAdapter,
  // Session types (Issue #14)
  CartItem,
  SessionRequest,
  SessionResponse,
  AppliedEffect,
  // Loyalty types (Issue #15)
  LoyaltyTier,
  NextTierInfo,
  LoyaltySummary,
  LoyaltyProfile,
  LoyaltyTransaction,
  LoyaltyHistoryResponse,
  // Affiliate types (Issue #22)
  AffiliateTier,
  ReferralInfo,
  AffiliateEarnings,
  AffiliateStats,
  AffiliateStatsResponse,
  LeaderboardEntry,
  LeaderboardResponse,
} from './types.js';

// Re-export internals for advanced usage
export { createStorage } from './storage/index.js';
export { EventQueue } from './queue/index.js';
export { HttpClient } from './network/index.js';
export { SessionManager } from './session/index.js';
export { LoyaltyManager } from './loyalty/index.js';
// Issue #22: Referral and Affiliate managers
export { ReferralManager } from './referral/index.js';
export { AffiliateManager } from './affiliate/index.js';
