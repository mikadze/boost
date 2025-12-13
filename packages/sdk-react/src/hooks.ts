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
