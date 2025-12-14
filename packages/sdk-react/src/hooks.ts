'use client';

import { useCallback, useState, useEffect } from 'react';
import { useGamifyContext, type GamifyContextValue } from './context.js';
import type {
  CartItem,
  SessionResponse,
  LoyaltyProfile,
  LoyaltyHistoryResponse,
  // Issue #22: Affiliate types
  AffiliateStats,
  LeaderboardResponse,
  // Gamification types
  QuestWithProgress,
  StreakWithProgress,
  StreaksResponse,
  FreezeResponse,
  BadgeWithStatus,
  BadgesResponse,
  RewardItem,
  RewardsStoreResponse,
  RedemptionResult,
} from '@gamify/core';

/**
 * useGamify - Hook to access Gamify SDK methods
 *
 * @throws Error if used outside of GamifyProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { track, identify } = useGamify();
 *
 *   const handleClick = () => {
 *     track('button_click', { buttonId: 'submit' });
 *   };
 *
 *   return <button onClick={handleClick}>Submit</button>;
 * }
 * ```
 */
export function useGamify(): GamifyContextValue {
  const context = useGamifyContext();

  if (!context) {
    throw new Error(
      'useGamify must be used within a GamifyProvider. ' +
        'Make sure your component is wrapped with <GamifyProvider>.'
    );
  }

  return context;
}

/**
 * useTrack - Hook for tracking events
 *
 * Returns a memoized track function that can be safely used in dependencies.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const track = useTrack();
 *
 *   useEffect(() => {
 *     track('component_viewed', { componentName: 'MyComponent' });
 *   }, [track]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useTrack(): (
  eventType: string,
  properties?: Record<string, unknown>
) => void {
  const context = useGamifyContext();

  return useCallback(
    (eventType: string, properties?: Record<string, unknown>) => {
      if (context) {
        context.track(eventType, properties);
      }
    },
    [context]
  );
}

/**
 * useIdentify - Hook for identifying users
 *
 * Returns a memoized identify function.
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const identify = useIdentify();
 *
 *   const handleLogin = async (user: User) => {
 *     await loginUser(user);
 *     identify(user.id, { email: user.email, name: user.name });
 *   };
 *
 *   return <button onClick={handleLogin}>Login</button>;
 * }
 * ```
 */
export function useIdentify(): (
  userId: string,
  traits?: Record<string, unknown>
) => void {
  const context = useGamifyContext();

  return useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      if (context) {
        context.identify(userId, traits);
      }
    },
    [context]
  );
}

// ============================================
// Issue #14: useSession Hook
// ============================================

interface SessionState {
  session: SessionResponse | null;
  loading: boolean;
  error: string | null;
}

interface SessionActions {
  updateCart: (items: CartItem[], coupons?: string[], currency?: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  complete: () => Promise<void>;
  clearSession: () => void;
  refresh: () => Promise<void>;
}

/**
 * useSession - Hook for managing cart sessions with discounts
 *
 * @example
 * ```tsx
 * function CartPage() {
 *   const { session, loading, updateCart, applyCoupon, complete } = useSession();
 *
 *   const handleAddItem = async (item: CartItem) => {
 *     const items = [...(session?.items || []), item];
 *     await updateCart(items);
 *   };
 *
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       <p>Subtotal: ${session?.subtotal}</p>
 *       <p>Discount: ${session?.discount}</p>
 *       <p>Total: ${session?.total}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSession(): SessionState & SessionActions {
  const context = useGamifyContext();
  const [state, setState] = useState<SessionState>({
    session: context?.client?.session?.getCachedSession() ?? null,
    loading: false,
    error: null,
  });

  const updateCart = useCallback(
    async (items: CartItem[], coupons?: string[], currency?: string) => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const session = await context.client.updateCart(items, coupons, currency);
        setState({ session, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [context]
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      if (!context?.client?.session) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const session = await context.client.session.applyCoupon(code);
        setState({ session, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [context]
  );

  const complete = useCallback(async () => {
    if (!context?.client?.session) {
      setState((s) => ({ ...s, error: 'SDK not initialized' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const session = await context.client.session.complete();
      setState({ session, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [context]);

  const clearSession = useCallback(() => {
    if (context?.client?.session) {
      context.client.session.clearSession();
      setState({ session: null, loading: false, error: null });
    }
  }, [context]);

  const refresh = useCallback(async () => {
    if (!context?.client?.session) {
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const session = await context.client.session.getSession();
      setState({ session, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [context]);

  return {
    ...state,
    updateCart,
    applyCoupon,
    complete,
    clearSession,
    refresh,
  };
}

// ============================================
// Issue #15: useLoyalty Hook
// ============================================

interface LoyaltyState {
  profile: LoyaltyProfile | null;
  history: LoyaltyHistoryResponse | null;
  loading: boolean;
  error: string | null;
}

interface LoyaltyActions {
  refreshProfile: () => Promise<void>;
  refreshHistory: (limit?: number, offset?: number) => Promise<void>;
}

/**
 * useLoyalty - Hook for managing customer loyalty data
 *
 * @param options - Auto-refresh options
 *
 * @example
 * ```tsx
 * function LoyaltyDashboard() {
 *   const { profile, history, loading, refreshProfile } = useLoyalty({
 *     autoRefresh: true,
 *   });
 *
 *   return (
 *     <div>
 *       {loading && <Spinner />}
 *       <p>Points: {profile?.points}</p>
 *       <p>Tier: {profile?.tier?.name}</p>
 *       <p>Next tier: {profile?.nextTier?.name} ({profile?.nextTier?.pointsNeeded} points needed)</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLoyalty(options?: {
  autoRefresh?: boolean;
}): LoyaltyState & LoyaltyActions {
  const context = useGamifyContext();
  const [state, setState] = useState<LoyaltyState>({
    profile: context?.client?.loyalty?.getCachedProfile() ?? null,
    history: null,
    loading: false,
    error: null,
  });

  const refreshProfile = useCallback(async () => {
    if (!context?.client) {
      setState((s) => ({ ...s, error: 'SDK not initialized' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const profile = await context.client.getLoyaltyProfile();
      setState((s) => ({ ...s, profile, loading: false, error: null }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [context]);

  const refreshHistory = useCallback(
    async (limit?: number, offset?: number) => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const history = await context.client.getLoyaltyHistory(limit, offset);
        setState((s) => ({ ...s, history, loading: false, error: null }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [context]
  );

  // Auto-refresh on mount if user is identified
  useEffect(() => {
    if (options?.autoRefresh && context?.client?.getUserId()) {
      void refreshProfile();
    }
  }, [options?.autoRefresh, context, refreshProfile]);

  return {
    ...state,
    refreshProfile,
    refreshHistory,
  };
}

// ============================================
// Issue #22: useReferral Hook
// ============================================

interface ReferralState {
  referrerCode: string | null;
  hasReferrer: boolean;
}

interface ReferralActions {
  setReferrer: (code: string) => void;
  clearReferrer: () => void;
  detectFromUrl: () => string | null;
}

/**
 * useReferral - Hook for managing referral attribution
 *
 * Automatically detects `?ref=code` parameter from URLs and stores
 * the referrer code in localStorage for attribution tracking.
 *
 * @example
 * ```tsx
 * function SignupPage() {
 *   const { referrerCode, hasReferrer, setReferrer } = useReferral();
 *
 *   useEffect(() => {
 *     if (hasReferrer) {
 *       console.log('User was referred by:', referrerCode);
 *     }
 *   }, [hasReferrer, referrerCode]);
 *
 *   return (
 *     <div>
 *       {hasReferrer && <p>Thanks for using referral code: {referrerCode}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useReferral(): ReferralState & ReferralActions {
  const context = useGamifyContext();
  const [state, setState] = useState<ReferralState>({
    referrerCode: context?.client?.referral?.getReferrer() ?? null,
    hasReferrer: context?.client?.referral?.hasReferrer() ?? false,
  });

  const setReferrer = useCallback(
    (code: string) => {
      if (context?.client?.referral) {
        context.client.referral.setReferrer(code);
        setState({
          referrerCode: code,
          hasReferrer: true,
        });
      }
    },
    [context]
  );

  const clearReferrer = useCallback(() => {
    if (context?.client?.referral) {
      context.client.referral.clearReferrer();
      setState({
        referrerCode: null,
        hasReferrer: false,
      });
    }
  }, [context]);

  const detectFromUrl = useCallback(() => {
    if (context?.client?.referral) {
      const code = context.client.referral.detectReferrerFromUrl();
      if (code) {
        setState({
          referrerCode: code,
          hasReferrer: true,
        });
      }
      return code;
    }
    return null;
  }, [context]);

  // Auto-detect on mount
  useEffect(() => {
    if (context?.client?.referral) {
      const code = context.client.referral.getReferrer();
      setState({
        referrerCode: code,
        hasReferrer: code !== null,
      });
    }
  }, [context]);

  return {
    ...state,
    setReferrer,
    clearReferrer,
    detectFromUrl,
  };
}

// ============================================
// Issue #22: useAffiliateStats Hook
// ============================================

interface AffiliateState {
  stats: AffiliateStats | null;
  loading: boolean;
  error: string | null;
}

interface AffiliateActions {
  refreshStats: (forceRefresh?: boolean) => Promise<void>;
}

/**
 * useAffiliateStats - Hook for fetching user affiliate statistics
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function AffiliateDashboard() {
 *   const { stats, loading, error, refreshStats } = useAffiliateStats({
 *     autoRefresh: true,
 *   });
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <div>
 *       <p>Your referral code: {stats?.referralCode}</p>
 *       <p>Referrals: {stats?.referralCount}</p>
 *       <p>Total earnings: ${(stats?.earnings.totalEarned ?? 0) / 100}</p>
 *       <p>Current tier: {stats?.tier?.name ?? 'None'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAffiliateStats(options?: {
  autoRefresh?: boolean;
}): AffiliateState & AffiliateActions {
  const context = useGamifyContext();
  const [state, setState] = useState<AffiliateState>({
    stats: context?.client?.affiliate?.getCachedStats() ?? null,
    loading: false,
    error: null,
  });

  const refreshStats = useCallback(
    async (forceRefresh = false) => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const stats = await context.client.getAffiliateStats(forceRefresh);
        setState({ stats, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [context]
  );

  // Auto-refresh on mount if user is identified
  useEffect(() => {
    if (options?.autoRefresh && context?.client?.getUserId()) {
      void refreshStats();
    }
  }, [options?.autoRefresh, context, refreshStats]);

  return {
    ...state,
    refreshStats,
  };
}

// ============================================
// Issue #22: useLeaderboard Hook
// ============================================

interface LeaderboardState {
  leaderboard: LeaderboardResponse | null;
  loading: boolean;
  error: string | null;
}

interface LeaderboardActions {
  refresh: (limit?: number) => Promise<void>;
}

/**
 * useLeaderboard - Hook for fetching affiliate leaderboard data
 *
 * @param limit - Number of entries to fetch (default: 10)
 *
 * @example
 * ```tsx
 * function LeaderboardPage() {
 *   const { leaderboard, loading, error, refresh } = useLeaderboard(10);
 *
 *   useEffect(() => {
 *     refresh();
 *   }, [refresh]);
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <ol>
 *       {leaderboard?.entries.map((entry) => (
 *         <li key={entry.userId}>
 *           #{entry.rank} - {entry.displayName}: {entry.referralCount} referrals
 *         </li>
 *       ))}
 *     </ol>
 *   );
 * }
 * ```
 */
export function useLeaderboard(
  limit = 10
): LeaderboardState & LeaderboardActions {
  const context = useGamifyContext();
  const [state, setState] = useState<LeaderboardState>({
    leaderboard: null,
    loading: false,
    error: null,
  });

  const refresh = useCallback(
    async (customLimit?: number) => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const leaderboard = await context.client.getLeaderboard(customLimit ?? limit);
        setState({ leaderboard, loading: false, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [context, limit]
  );

  return {
    ...state,
    refresh,
  };
}

// ============================================
// Issue #25-28: useQuests Hook
// ============================================

interface QuestsState {
  quests: QuestWithProgress[];
  loading: boolean;
  error: string | null;
}

interface QuestsActions {
  refresh: () => Promise<void>;
}

/**
 * useQuests - Hook for fetching user's quest progress
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function QuestsPage() {
 *   const { quests, loading, error, refresh } = useQuests({ autoRefresh: true });
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <div>
 *       {quests.map((quest) => (
 *         <div key={quest.id}>
 *           <h3>{quest.name}</h3>
 *           <p>Progress: {quest.percentComplete}%</p>
 *           <p>Status: {quest.status}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useQuests(options?: {
  autoRefresh?: boolean;
}): QuestsState & QuestsActions {
  const context = useGamifyContext();
  const [state, setState] = useState<QuestsState>({
    quests: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!context?.client) {
      setState((s) => ({ ...s, error: 'SDK not initialized' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const response = await context.client.getQuests();
      setState({ quests: response.quests, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [context]);

  // Auto-refresh on mount if user is identified
  useEffect(() => {
    if (options?.autoRefresh && context?.client?.getUserId()) {
      void refresh();
    }
  }, [options?.autoRefresh, context, refresh]);

  return {
    ...state,
    refresh,
  };
}

// ============================================
// Issue #32: useStreaks Hook
// ============================================

interface StreaksState {
  streaks: StreakWithProgress[];
  stats: StreaksResponse['stats'] | null;
  loading: boolean;
  error: string | null;
}

interface StreaksActions {
  refresh: () => Promise<void>;
  freeze: (ruleId: string) => Promise<FreezeResponse | null>;
}

/**
 * useStreaks - Hook for managing user's streak progress
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function StreaksPage() {
 *   const { streaks, stats, loading, freeze } = useStreaks({ autoRefresh: true });
 *
 *   return (
 *     <div>
 *       <p>Active streaks: {stats?.totalActive}</p>
 *       {streaks.map((streak) => (
 *         <div key={streak.id}>
 *           <span>🔥 {streak.currentCount}</span>
 *           <span>{streak.name}</span>
 *           {streak.freezeInventory > 0 && (
 *             <button onClick={() => freeze(streak.id)}>
 *               Use Freeze ({streak.freezeInventory} left)
 *             </button>
 *           )}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStreaks(options?: {
  autoRefresh?: boolean;
}): StreaksState & StreaksActions {
  const context = useGamifyContext();
  const [state, setState] = useState<StreaksState>({
    streaks: [],
    stats: null,
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!context?.client) {
      setState((s) => ({ ...s, error: 'SDK not initialized' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const response = await context.client.getStreaks();
      setState({
        streaks: response.streaks,
        stats: response.stats,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [context]);

  const freeze = useCallback(
    async (ruleId: string): Promise<FreezeResponse | null> => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return null;
      }

      try {
        const result = await context.client.useStreakFreeze(ruleId);
        // Refresh to update freeze count
        await refresh();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, error: message }));
        return null;
      }
    },
    [context, refresh]
  );

  // Auto-refresh on mount if user is identified
  useEffect(() => {
    if (options?.autoRefresh && context?.client?.getUserId()) {
      void refresh();
    }
  }, [options?.autoRefresh, context, refresh]);

  return {
    ...state,
    refresh,
    freeze,
  };
}

// ============================================
// Issue #33: useBadges Hook
// ============================================

interface BadgesState {
  badges: BadgeWithStatus[];
  stats: BadgesResponse['stats'] | null;
  earned: BadgeWithStatus[];
  locked: BadgeWithStatus[];
  loading: boolean;
  error: string | null;
}

interface BadgesActions {
  refresh: (category?: string) => Promise<void>;
}

/**
 * useBadges - Hook for fetching user's badge collection
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function BadgesPage() {
 *   const { badges, earned, locked, stats, loading } = useBadges({ autoRefresh: true });
 *
 *   return (
 *     <div>
 *       <p>Unlocked: {stats?.unlocked} / {stats?.total}</p>
 *       <div className="grid">
 *         {badges.map((badge) => (
 *           <div key={badge.id} className={badge.isUnlocked ? '' : 'grayscale'}>
 *             <img src={badge.iconUrl} alt={badge.name} />
 *             <span>{badge.name}</span>
 *             <span className={`rarity-${badge.rarity.toLowerCase()}`}>
 *               {badge.rarity}
 *             </span>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBadges(options?: {
  autoRefresh?: boolean;
  category?: string;
}): BadgesState & BadgesActions {
  const context = useGamifyContext();
  const [state, setState] = useState<BadgesState>({
    badges: [],
    stats: null,
    earned: [],
    locked: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(
    async (category?: string) => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const response = await context.client.getBadges(category ?? options?.category);
        const earned = response.badges.filter((b) => b.isUnlocked);
        const locked = response.badges.filter((b) => !b.isUnlocked);
        setState({
          badges: response.badges,
          stats: response.stats,
          earned,
          locked,
          loading: false,
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
      }
    },
    [context, options?.category]
  );

  // Auto-refresh on mount if user is identified
  useEffect(() => {
    if (options?.autoRefresh && context?.client?.getUserId()) {
      void refresh();
    }
  }, [options?.autoRefresh, context, refresh]);

  return {
    ...state,
    refresh,
  };
}

// ============================================
// Issue #34: useRewards Hook
// ============================================

interface RewardsState {
  items: RewardItem[];
  userPoints: number;
  available: RewardItem[];
  unavailable: RewardItem[];
  loading: boolean;
  error: string | null;
}

interface RewardsActions {
  refresh: () => Promise<void>;
  redeem: (itemId: string) => Promise<RedemptionResult | null>;
}

/**
 * useRewards - Hook for fetching and redeeming rewards
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function RewardsStore() {
 *   const { items, userPoints, loading, redeem } = useRewards({ autoRefresh: true });
 *
 *   const handleRedeem = async (itemId: string) => {
 *     const result = await redeem(itemId);
 *     if (result?.success) {
 *       alert('Reward redeemed!');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <p>Your points: {userPoints}</p>
 *       <div className="grid">
 *         {items.map((item) => (
 *           <div key={item.id}>
 *             <img src={item.imageUrl} alt={item.name} />
 *             <span>{item.name}</span>
 *             <span>{item.pointsCost} points</span>
 *             <button
 *               disabled={!item.isAvailable}
 *               onClick={() => handleRedeem(item.id)}
 *             >
 *               {item.canAfford ? 'Redeem' : `Need ${item.pointsCost - userPoints} more`}
 *             </button>
 *           </div>
 *         ))}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRewards(options?: {
  autoRefresh?: boolean;
}): RewardsState & RewardsActions {
  const context = useGamifyContext();
  const [state, setState] = useState<RewardsState>({
    items: [],
    userPoints: 0,
    available: [],
    unavailable: [],
    loading: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!context?.client) {
      setState((s) => ({ ...s, error: 'SDK not initialized' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const response = await context.client.getRewardsStore();
      const available = response.items.filter((i) => i.isAvailable);
      const unavailable = response.items.filter((i) => !i.isAvailable);
      setState({
        items: response.items,
        userPoints: response.userPoints,
        available,
        unavailable,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [context]);

  const redeem = useCallback(
    async (itemId: string): Promise<RedemptionResult | null> => {
      if (!context?.client) {
        setState((s) => ({ ...s, error: 'SDK not initialized' }));
        return null;
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const result = await context.client.redeemReward(itemId);
        // Refresh to update points and availability
        await refresh();
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setState((s) => ({ ...s, loading: false, error: message }));
        return null;
      }
    },
    [context, refresh]
  );

  // Auto-refresh on mount if user is identified
  useEffect(() => {
    if (options?.autoRefresh && context?.client?.getUserId()) {
      void refresh();
    }
  }, [options?.autoRefresh, context, refresh]);

  return {
    ...state,
    refresh,
    redeem,
  };
}
