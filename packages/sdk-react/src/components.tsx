'use client';

import React, { useEffect, useRef, useState, cloneElement } from 'react';
import {
  useTrack,
  useAffiliateStats,
  useLeaderboard,
  useReferral,
  useQuests,
  useStreaks,
  useBadges,
  useRewards,
  useLoyalty,
} from './hooks.js';
import type {
  LeaderboardEntry,
  QuestWithProgress,
  QuestStep,
  StreakWithProgress,
  BadgeWithStatus,
  BadgeRarity,
  RewardItem,
  RedemptionResult,
} from '@gamifyio/core';

// ============================================
// Optional framer-motion support
// ============================================

type MotionComponent = React.ComponentType<{
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  key?: string | number;
  onClick?: () => void;
}>;

type AnimatePresenceComponent = React.ComponentType<{
  children?: React.ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
}>;

let MotionDiv: MotionComponent | 'div' = 'div';
let AnimatePresenceWrapper: AnimatePresenceComponent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

// Try to import framer-motion (will fail gracefully if not installed)
try {
  // Dynamic import at module level for bundlers that support it
  const framerMotion = require('framer-motion');
  if (framerMotion?.motion?.div) {
    MotionDiv = framerMotion.motion.div;
  }
  if (framerMotion?.AnimatePresence) {
    AnimatePresenceWrapper = framerMotion.AnimatePresence;
  }
} catch {
  // framer-motion not installed, use fallbacks
}

// Helper to check if animations are available
const hasAnimations = MotionDiv !== 'div';

// ============================================
// Error Boundary for SDK Components
// ============================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Error boundary component to prevent SDK components from crashing client sites
 */
class GamifyErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{ padding: '16px', color: '#6c757d', fontSize: '14px', textAlign: 'center' }}>
          Unable to load this section. Please try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * HOC to wrap components with error boundary
 */
function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props: P) => {
    return (
      <GamifyErrorBoundary fallback={fallback}>
        <Component {...props} />
      </GamifyErrorBoundary>
    );
  };
  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

/**
 * Props for GamifyPageView component
 */
export interface GamifyPageViewProps {
  /** Custom page name (defaults to document.title or window.location.pathname) */
  pageName?: string;
  /** Additional properties to include with page view events */
  properties?: Record<string, unknown>;
  /** Track on route changes (for SPAs) - requires pathname prop */
  pathname?: string;
}

/**
 * GamifyPageView - Component for automatic page view tracking
 *
 * Place this component in your layout or page components to automatically
 * track page views. For SPAs using Next.js App Router, pass the pathname
 * from usePathname() to track route changes.
 *
 * @example
 * ```tsx
 * // Basic usage - tracks on mount
 * function Page() {
 *   return (
 *     <>
 *       <GamifyPageView />
 *       <div>Page content</div>
 *     </>
 *   );
 * }
 *
 * // With Next.js App Router
 * 'use client';
 * import { usePathname } from 'next/navigation';
 *
 * function Layout({ children }) {
 *   const pathname = usePathname();
 *   return (
 *     <>
 *       <GamifyPageView pathname={pathname} />
 *       {children}
 *     </>
 *   );
 * }
 *
 * // With custom properties
 * function ProductPage({ productId }) {
 *   return (
 *     <>
 *       <GamifyPageView
 *         pageName="Product Detail"
 *         properties={{ productId, category: 'electronics' }}
 *       />
 *       <div>Product content</div>
 *     </>
 *   );
 * }
 * ```
 */
export function GamifyPageView({
  pageName,
  properties,
  pathname,
}: GamifyPageViewProps) {
  const track = useTrack();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if running on server
    if (typeof window === 'undefined') {
      return;
    }

    // For SPA routing: only track if pathname changed
    if (pathname !== undefined) {
      if (lastPathRef.current === pathname) {
        return;
      }
      lastPathRef.current = pathname;
    }

    // Determine page name
    const page =
      pageName ??
      (typeof document !== 'undefined' ? document.title : null) ??
      (typeof window !== 'undefined' ? window.location.pathname : 'unknown');

    // Track page view
    track('page_view', {
      page,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...properties,
    });
  }, [track, pageName, pathname, properties]);

  // This component doesn't render anything
  return null;
}

/**
 * Props for GamifyTrackClick component
 */
export interface GamifyTrackClickProps {
  /** Event type to track */
  eventType: string;
  /** Properties to include with the event */
  properties?: Record<string, unknown>;
  /** Child element (must accept onClick) */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
}

/**
 * GamifyTrackClick - Component wrapper for click tracking
 *
 * Wraps a child element and tracks clicks automatically.
 *
 * @example
 * ```tsx
 * <GamifyTrackClick
 *   eventType="button_click"
 *   properties={{ buttonId: 'subscribe', location: 'header' }}
 * >
 *   <button>Subscribe</button>
 * </GamifyTrackClick>
 * ```
 */
export function GamifyTrackClick({
  eventType,
  properties,
  children,
}: GamifyTrackClickProps) {
  const track = useTrack();

  const handleClick = (e: React.MouseEvent) => {
    track(eventType, properties);

    // Call original onClick if it exists
    if (children.props.onClick) {
      children.props.onClick(e);
    }
  };

  // Clone the child and inject onClick handler
  return cloneElement(children, { onClick: handleClick });
}

// ============================================
// Issue #23: Affiliate UI Components
// ============================================

/**
 * Default styles for affiliate components
 * Uses CSS-in-JS for zero-dependency styling
 */
const defaultStyles = {
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    padding: '16px',
  } as React.CSSProperties,
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    border: '1px solid #e9ecef',
  } as React.CSSProperties,
  statsValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: '4px',
  } as React.CSSProperties,
  statsLabel: {
    fontSize: '14px',
    color: '#6c757d',
  } as React.CSSProperties,
  leaderboardContainer: {
    padding: '16px',
  } as React.CSSProperties,
  leaderboardList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  leaderboardRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #e9ecef',
  } as React.CSSProperties,
  leaderboardRowHighlighted: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#fff3cd',
  } as React.CSSProperties,
  leaderboardRank: {
    fontWeight: 'bold',
    width: '40px',
    color: '#212529',
  } as React.CSSProperties,
  leaderboardName: {
    flex: 1,
    marginLeft: '12px',
    color: '#212529',
  } as React.CSSProperties,
  leaderboardStats: {
    color: '#6c757d',
    fontSize: '14px',
  } as React.CSSProperties,
  leaderboardEmpty: {
    textAlign: 'center' as const,
    padding: '32px',
    color: '#6c757d',
  } as React.CSSProperties,
  referralContainer: {
    display: 'flex',
    gap: '8px',
    padding: '8px',
  } as React.CSSProperties,
  referralInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#f8f9fa',
    color: '#212529',
  } as React.CSSProperties,
  referralButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#0d6efd',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  } as React.CSSProperties,
  // Tier badge styles
  tierBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  } as React.CSSProperties,
  tierBadgeIcon: {
    width: '20px',
    height: '20px',
  } as React.CSSProperties,
  tierBadgeText: {
    flex: 1,
  } as React.CSSProperties,
  tierBadgeName: {
    fontWeight: '500',
    fontSize: '14px',
  } as React.CSSProperties,
  tierBadgeRate: {
    fontSize: '12px',
    opacity: 0.8,
  } as React.CSSProperties,
  // Referral code row
  referralCodeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '12px',
  } as React.CSSProperties,
  referralCodeLabel: {
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '2px',
  } as React.CSSProperties,
  referralCodeValue: {
    fontFamily: 'monospace',
    fontWeight: '500',
    fontSize: '14px',
    color: '#212529',
  } as React.CSSProperties,
  referralCodeCopyButton: {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#6c757d',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  // 2-column stats grid
  statsGrid2Col: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  } as React.CSSProperties,
  // Earnings breakdown
  earningsBreakdown: {
    borderTop: '1px solid #e9ecef',
    paddingTop: '12px',
    marginTop: '12px',
  } as React.CSSProperties,
  earningsTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#212529',
    marginBottom: '8px',
  } as React.CSSProperties,
  earningsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  } as React.CSSProperties,
  earningsLabel: {
    fontSize: '14px',
    color: '#6c757d',
  } as React.CSSProperties,
  earningsValue: {
    fontFamily: 'monospace',
    fontWeight: '500',
    fontSize: '14px',
  } as React.CSSProperties,
  earningsValueGreen: {
    fontFamily: 'monospace',
    fontWeight: '500',
    fontSize: '14px',
    color: '#28a745',
  } as React.CSSProperties,
  earningsValueYellow: {
    fontFamily: 'monospace',
    fontWeight: '500',
    fontSize: '14px',
    color: '#ffc107',
  } as React.CSSProperties,
  // Medal styles for leaderboard
  medalIcon: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  } as React.CSSProperties,
  // Referrer attribution
  referrerSection: {
    borderTop: '1px solid #e9ecef',
    paddingTop: '12px',
    marginTop: '12px',
  } as React.CSSProperties,
  referrerTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#212529',
    marginBottom: '8px',
  } as React.CSSProperties,
  referrerBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    border: '1px solid rgba(40, 167, 69, 0.2)',
    borderRadius: '8px',
  } as React.CSSProperties,
  referrerBadgeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#212529',
  } as React.CSSProperties,
  referrerBadgeIcon: {
    color: '#28a745',
  } as React.CSSProperties,
  referrerClearButton: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#6c757d',
    cursor: 'pointer',
  } as React.CSSProperties,
  referrerInputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  } as React.CSSProperties,
  referrerDetectButton: {
    width: '100%',
    padding: '10px 16px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    backgroundColor: 'white',
    color: '#212529',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  } as React.CSSProperties,
  // Filter tabs
  filterTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  filterTab: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  filterTabActive: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '9999px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#0d6efd',
    color: 'white',
  } as React.CSSProperties,
  // Progress summary for badges
  progressSummary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  progressSummaryLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  progressSummaryIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'rgba(13, 110, 253, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#0d6efd',
    fontSize: '18px',
  } as React.CSSProperties,
  progressSummaryText: {
    fontWeight: '500',
    fontSize: '16px',
    color: '#212529',
  } as React.CSSProperties,
  progressSummarySubtext: {
    fontSize: '12px',
    color: '#6c757d',
  } as React.CSSProperties,
  progressSummaryBar: {
    width: '80px',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
  } as React.CSSProperties,
  progressSummaryBarFill: {
    height: '100%',
    backgroundColor: '#0d6efd',
    borderRadius: '4px',
  } as React.CSSProperties,
  // Badge progress bar for locked badges
  badgeProgressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#e9ecef',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '8px',
  } as React.CSSProperties,
  badgeProgressFill: {
    height: '100%',
    backgroundColor: '#6c757d',
    borderRadius: '2px',
  } as React.CSSProperties,
  badgeProgressText: {
    fontSize: '10px',
    color: '#6c757d',
    marginTop: '4px',
  } as React.CSSProperties,
  badgeCheckmark: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    color: '#28a745',
  } as React.CSSProperties,
};

/**
 * Props for AffiliateStats component
 */
export interface AffiliateStatsProps {
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Theme customization */
  theme?: {
    cardBackground?: string;
    cardBorder?: string;
    valueColor?: string;
    labelColor?: string;
  };
  /** Auto-refresh stats on mount */
  autoRefresh?: boolean;
  /** Show tier badge with commission rate (default: true) */
  showTierBadge?: boolean;
  /** Show referral code with copy button (default: true) */
  showReferralCode?: boolean;
  /** Show earnings breakdown section (default: true) */
  showEarningsBreakdown?: boolean;
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
}

/**
 * AffiliateStats - Display grid with affiliate statistics
 *
 * Shows referral count, clicks, and earnings in a card layout.
 * Headless-first: unstyled by default but includes sensible defaults.
 *
 * @example
 * ```tsx
 * <AffiliateStats autoRefresh />
 *
 * // With custom theme
 * <AffiliateStats
 *   theme={{ cardBackground: '#1a1a1a', valueColor: '#fff' }}
 * />
 * ```
 */
function AffiliateStatsInner({
  className,
  style,
  theme,
  autoRefresh = true,
  showTierBadge = true,
  showReferralCode = true,
  showEarningsBreakdown = true,
  renderLoading,
  renderError,
}: AffiliateStatsProps) {
  const { stats, loading, error, refreshStats } = useAffiliateStats({ autoRefresh });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoRefresh) {
      void refreshStats();
    }
  }, [autoRefresh, refreshStats]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  if (!stats || !stats.earnings) {
    return null;
  }

  const cardStyle = {
    ...defaultStyles.statsCard,
    ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
    ...(theme?.cardBorder && { border: `1px solid ${theme.cardBorder}` }),
  };

  const valueStyle = {
    ...defaultStyles.statsValue,
    ...(theme?.valueColor && { color: theme.valueColor }),
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: stats.earnings?.currency ?? 'USD',
    }).format(cents / 100);
  };

  const handleCopyCode = async () => {
    if (!stats.referralCode) return;
    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get tier color based on tier name (common tier naming conventions)
  const getTierColor = (tierName?: string): string => {
    if (!tierName) return '#6c757d';
    const name = tierName.toLowerCase();
    if (name.includes('elite') || name.includes('diamond') || name.includes('platinum')) return '#FFD700';
    if (name.includes('gold') || name.includes('vip')) return '#FFD700';
    if (name.includes('silver') || name.includes('pro')) return '#C0C0C0';
    if (name.includes('bronze') || name.includes('starter')) return '#CD7F32';
    return '#0d6efd'; // Default blue
  };

  const tierColor = getTierColor(stats.tier?.name);

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
    ...(theme?.cardBorder && { border: `1px solid ${theme.cardBorder}` }),
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Tier Badge */}
      {showTierBadge && (
        <div
          style={{
            ...defaultStyles.tierBadge,
            backgroundColor: stats.tier ? `${tierColor}20` : '#f8f9fa',
          }}
        >
          <span style={{ ...defaultStyles.tierBadgeIcon, color: tierColor }}>👑</span>
          <div style={defaultStyles.tierBadgeText}>
            <div style={{ ...defaultStyles.tierBadgeName, color: stats.tier ? tierColor : '#6c757d' }}>
              {stats.tier ? `${stats.tier.name} Affiliate` : 'No Tier'}
            </div>
            <div style={{ ...defaultStyles.tierBadgeRate, color: stats.tier ? tierColor : '#6c757d' }}>
              {stats.tier
                ? `${stats.tier.value}% commission rate`
                : 'Refer users to unlock affiliate status'}
            </div>
          </div>
        </div>
      )}

      {/* Referral Code */}
      {showReferralCode && stats.referralCode && (
        <div style={defaultStyles.referralCodeRow}>
          <div>
            <div style={defaultStyles.referralCodeLabel}>Your referral code</div>
            <div style={defaultStyles.referralCodeValue}>{stats.referralCode}</div>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            style={defaultStyles.referralCodeCopyButton}
            aria-label="Copy referral code"
          >
            {copied ? '✓' : '📋'}
          </button>
        </div>
      )}

      {/* 2-Column Stats Grid */}
      <div style={defaultStyles.statsGrid2Col}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c757d', marginBottom: '4px' }}>
            <span>👥</span>
            <span style={{ fontSize: '12px' }}>Referrals</span>
          </div>
          <div style={{ ...valueStyle, fontFamily: 'monospace' }}>{stats.referralCount}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c757d', marginBottom: '4px' }}>
            <span>💰</span>
            <span style={{ fontSize: '12px' }}>Commissions</span>
          </div>
          <div style={{ ...valueStyle, fontFamily: 'monospace' }}>{stats.earnings.transactionCount}</div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      {showEarningsBreakdown && (
        <div style={defaultStyles.earningsBreakdown}>
          <div style={defaultStyles.earningsTitle}>Earnings</div>
          <div style={defaultStyles.earningsRow}>
            <span style={defaultStyles.earningsLabel}>Total Earned</span>
            <span style={defaultStyles.earningsValueGreen}>
              {formatCurrency(stats.earnings.totalEarned)}
            </span>
          </div>
          <div style={defaultStyles.earningsRow}>
            <span style={defaultStyles.earningsLabel}>Pending</span>
            <span style={defaultStyles.earningsValueYellow}>
              {formatCurrency(stats.earnings.totalPending)}
            </span>
          </div>
          <div style={defaultStyles.earningsRow}>
            <span style={defaultStyles.earningsLabel}>Paid Out</span>
            <span style={{ ...defaultStyles.earningsValue, color: '#6c757d' }}>
              {formatCurrency(stats.earnings.totalPaid)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export const AffiliateStats = withErrorBoundary(AffiliateStatsInner);

/**
 * Props for Leaderboard component
 */
export interface LeaderboardProps {
  /** Number of entries to display (default: 10) */
  limit?: number;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Current user ID for highlighting */
  currentUserId?: string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Show medal icons for top 3 positions (default: true) */
  showMedals?: boolean;
  /** Show tier info with percentage (default: true) */
  showTierInfo?: boolean;
  /** Show earnings column (default: true) */
  showEarnings?: boolean;
  /** Theme customization */
  theme?: {
    rowBackground?: string;
    highlightBackground?: string;
    textColor?: string;
    secondaryColor?: string;
  };
  /** Custom render for each row */
  renderRow?: (entry: LeaderboardEntry, isCurrentUser: boolean) => React.ReactNode;
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
}

/**
 * Leaderboard - Ranked affiliate leaderboard display
 *
 * Shows ranked list of top affiliates with referral counts.
 * Highlights the current user if their ID is provided.
 *
 * @example
 * ```tsx
 * <Leaderboard limit={10} currentUserId={userId} />
 *
 * // With custom render
 * <Leaderboard
 *   renderRow={(entry, isCurrent) => (
 *     <div className={isCurrent ? 'highlight' : ''}>
 *       #{entry.rank} - {entry.displayName}
 *     </div>
 *   )}
 * />
 * ```
 */
function LeaderboardInner({
  limit = 10,
  className,
  style,
  currentUserId,
  emptyMessage = 'No leaderboard data available yet.',
  showMedals = true,
  showTierInfo = true,
  showEarnings = true,
  theme,
  renderRow,
  renderLoading,
  renderError,
}: LeaderboardProps) {
  const { leaderboard, loading, error, refresh } = useLeaderboard(limit);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <div className={className} style={{ ...defaultStyles.leaderboardEmpty, ...style }}>
        {emptyMessage}
      </div>
    );
  }

  // Medal colors for top 3
  const getMedalColor = (rank: number): string | null => {
    if (!showMedals) return null;
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return null;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getRowStyle = (isCurrentUser: boolean): React.CSSProperties => ({
    ...(isCurrentUser ? defaultStyles.leaderboardRowHighlighted : defaultStyles.leaderboardRow),
    ...(theme?.rowBackground && !isCurrentUser && { backgroundColor: theme.rowBackground }),
    ...(theme?.highlightBackground && isCurrentUser && { backgroundColor: theme.highlightBackground }),
    ...(isCurrentUser && {
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      border: '1px solid rgba(13, 110, 253, 0.3)',
      borderRadius: '8px',
    }),
  });

  const textStyle = theme?.textColor ? { color: theme.textColor } : {};
  const secondaryStyle = theme?.secondaryColor
    ? { ...defaultStyles.leaderboardStats, color: theme.secondaryColor }
    : defaultStyles.leaderboardStats;

  // Find current user rank
  const currentUserRank = currentUserId
    ? leaderboard.entries.find((e) => e.userId === currentUserId)?.rank
    : null;

  return (
    <div className={className} style={{ ...defaultStyles.leaderboardContainer, ...style }}>
      {/* Current user rank badge */}
      {currentUserRank && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '12px',
            backgroundColor: 'rgba(13, 110, 253, 0.2)',
            color: '#0d6efd',
            padding: '4px 8px',
            borderRadius: '9999px',
          }}>
            Your rank: #{currentUserRank}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresenceWrapper mode="popLayout">
          {leaderboard.entries.map((entry, index) => {
            const isCurrentUser = currentUserId === entry.userId;
            const medalColor = getMedalColor(entry.rank);

            if (renderRow) {
              return <div key={entry.userId}>{renderRow(entry, isCurrentUser)}</div>;
            }

            const rowContent = (
              <div style={getRowStyle(isCurrentUser)}>
                {/* Rank / Medal */}
                <div style={defaultStyles.medalIcon}>
                  {medalColor ? (
                    <span style={{ color: medalColor }}>🏅</span>
                  ) : (
                    <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#6c757d' }}>
                      #{entry.rank}
                    </span>
                  )}
                </div>

                {/* Name & Tier */}
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...defaultStyles.leaderboardName, ...textStyle, marginLeft: 0 }}>
                      {entry.displayName ?? `User ${entry.userId.slice(0, 8)}`}
                    </span>
                    {isCurrentUser && (
                      <span style={{ fontSize: '12px', color: '#0d6efd' }}>(You)</span>
                    )}
                  </div>
                  {showTierInfo && entry.tier && (
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {entry.tier.name} ({entry.tier.value}%)
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '500' }}>
                    {entry.referralCount} referrals
                  </div>
                  {showEarnings && entry.totalEarnings !== undefined && (
                    <div style={{ ...secondaryStyle, fontFamily: 'monospace' }}>
                      {formatCurrency(entry.totalEarnings)}
                    </div>
                  )}
                </div>
              </div>
            );

            // Wrap with motion if available
            if (MotionDiv !== 'div') {
              const Motion = MotionDiv as MotionComponent;
              return (
                <Motion
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {rowContent}
                </Motion>
              );
            }

            return <div key={entry.userId}>{rowContent}</div>;
          })}
        </AnimatePresenceWrapper>
      </div>

      {/* Footer */}
      <p style={{ fontSize: '12px', color: '#6c757d', textAlign: 'center', marginTop: '12px' }}>
        Rankings based on total referrals
      </p>
    </div>
  );
}

export const Leaderboard = withErrorBoundary(LeaderboardInner);

/**
 * Props for ReferralLink component
 */
export interface ReferralLinkProps {
  /** Base URL for referral link (defaults to current origin) */
  baseUrl?: string;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Text for copy button */
  copyButtonText?: string;
  /** Text shown after copying */
  copiedText?: string;
  /** Text for share button (mobile only) */
  shareButtonText?: string;
  /** Share title */
  shareTitle?: string;
  /** Share text */
  shareText?: string;
  /** Show share button on mobile */
  showShareButton?: boolean;
  /** Show referrer attribution section (default: true) */
  showReferrerAttribution?: boolean;
  /** Current referrer code (who referred this user) */
  referrerCode?: string | null;
  /** Callback when referrer is set */
  onSetReferrer?: (code: string) => void;
  /** Callback to detect referrer from URL */
  onDetectFromUrl?: () => void;
  /** Callback when referrer is cleared */
  onClearReferrer?: () => void;
  /** Theme customization */
  theme?: {
    inputBackground?: string;
    inputBorder?: string;
    inputColor?: string;
    buttonBackground?: string;
    buttonColor?: string;
  };
  /** Callback when link is copied */
  onCopy?: (link: string) => void;
  /** Callback when link is shared */
  onShare?: (link: string) => void;
}

/**
 * ReferralLink - Input field with user's referral code and copy/share buttons
 *
 * Displays the user's unique referral link with easy copy functionality.
 * Includes native share button for mobile devices.
 *
 * @example
 * ```tsx
 * <ReferralLink />
 *
 * // With custom base URL
 * <ReferralLink
 *   baseUrl="https://myapp.com/signup"
 *   shareTitle="Join my app!"
 *   shareText="Sign up using my referral link"
 * />
 * ```
 */
function ReferralLinkInner({
  baseUrl,
  className,
  style,
  copyButtonText = 'Copy',
  copiedText = 'Copied!',
  shareButtonText = 'Share',
  shareTitle = 'Check this out!',
  shareText = 'Join using my referral link',
  showShareButton = true,
  showReferrerAttribution = true,
  referrerCode,
  onSetReferrer,
  onDetectFromUrl,
  onClearReferrer,
  theme,
  onCopy,
  onShare,
}: ReferralLinkProps) {
  const { stats } = useAffiliateStats({ autoRefresh: true });
  const [copied, setCopied] = useState(false);
  const [referrerInput, setReferrerInput] = useState('');

  const userReferralCode = stats?.referralCode;

  if (!userReferralCode) {
    return null;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl ?? origin}?ref=${userReferralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      onCopy?.(referralLink);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: referralLink,
        });
        onShare?.(referralLink);
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share:', err);
        }
      }
    }
  };

  const handleSetReferrer = () => {
    if (referrerInput.trim() && onSetReferrer) {
      onSetReferrer(referrerInput.trim());
      setReferrerInput('');
    }
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const inputStyle = {
    ...defaultStyles.referralInput,
    ...(theme?.inputBackground && { backgroundColor: theme.inputBackground }),
    ...(theme?.inputBorder && { border: `1px solid ${theme.inputBorder}` }),
    ...(theme?.inputColor && { color: theme.inputColor }),
  };

  const buttonStyle = {
    ...defaultStyles.referralButton,
    ...(theme?.buttonBackground && { backgroundColor: theme.buttonBackground }),
    ...(theme?.buttonColor && { color: theme.buttonColor }),
  };

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Your Referral Link */}
      <div style={{ marginBottom: '8px' }}>
        <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>
          Your unique referral link:
        </p>
        <div style={defaultStyles.referralContainer}>
          <input
            type="text"
            readOnly
            value={referralLink}
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button type="button" onClick={handleCopy} style={buttonStyle}>
            {copied ? '✓' : '📋'}
          </button>
          {showShareButton && canShare && (
            <button type="button" onClick={handleShare} style={buttonStyle}>
              {shareButtonText}
            </button>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
          Code: <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>{userReferralCode}</span>
        </p>
      </div>

      {/* Referrer Attribution */}
      {showReferrerAttribution && (
        <div style={defaultStyles.referrerSection}>
          <p style={defaultStyles.referrerTitle}>Referrer Attribution</p>

          {referrerCode ? (
            <div style={defaultStyles.referrerBadge}>
              <div style={defaultStyles.referrerBadgeInfo}>
                <span style={defaultStyles.referrerBadgeIcon}>👤</span>
                <span>
                  Referred by: <span style={{ fontFamily: 'monospace', fontWeight: '500' }}>{referrerCode}</span>
                </span>
              </div>
              {onClearReferrer && (
                <button
                  type="button"
                  onClick={onClearReferrer}
                  style={defaultStyles.referrerClearButton}
                  aria-label="Clear referrer"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div>
              {onSetReferrer && (
                <div style={defaultStyles.referrerInputRow}>
                  <input
                    type="text"
                    value={referrerInput}
                    onChange={(e) => setReferrerInput(e.target.value)}
                    placeholder="Enter referrer code..."
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    onClick={handleSetReferrer}
                    disabled={!referrerInput.trim()}
                    style={{
                      ...buttonStyle,
                      opacity: referrerInput.trim() ? 1 : 0.5,
                      cursor: referrerInput.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Set
                  </button>
                </div>
              )}
              {onDetectFromUrl && (
                <button
                  type="button"
                  onClick={onDetectFromUrl}
                  style={defaultStyles.referrerDetectButton}
                >
                  <span>🔗</span>
                  Detect from URL
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const ReferralLink = withErrorBoundary(ReferralLinkInner);

// ============================================
// Issue #25-28: Quest Components
// ============================================

/**
 * Extended styles for gamification components
 */
const gamificationStyles = {
  // Quest styles
  questContainer: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    marginBottom: '12px',
  } as React.CSSProperties,
  questHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  } as React.CSSProperties,
  questTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529',
    margin: 0,
  } as React.CSSProperties,
  questDescription: {
    fontSize: '14px',
    color: '#6c757d',
    margin: '4px 0 0 0',
  } as React.CSSProperties,
  questBadge: {
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  } as React.CSSProperties,
  questProgressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  } as React.CSSProperties,
  questProgressFill: {
    height: '100%',
    backgroundColor: '#0d6efd',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  questStepList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  questStep: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f8f9fa',
    fontSize: '14px',
  } as React.CSSProperties,
  questStepIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '12px',
    fontSize: '12px',
  } as React.CSSProperties,
  questStepText: {
    flex: 1,
    color: '#212529',
  } as React.CSSProperties,
  questStepCount: {
    fontSize: '12px',
    color: '#6c757d',
  } as React.CSSProperties,
  questReward: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#856404',
  } as React.CSSProperties,

  // Streak styles
  streakContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  } as React.CSSProperties,
  streakFlame: {
    fontSize: '32px',
    marginRight: '12px',
  } as React.CSSProperties,
  streakCount: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#212529',
    marginRight: '8px',
  } as React.CSSProperties,
  streakLabel: {
    fontSize: '14px',
    color: '#6c757d',
  } as React.CSSProperties,
  streakInfo: {
    flex: 1,
  } as React.CSSProperties,
  streakName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529',
  } as React.CSSProperties,
  streakStatus: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '10px',
    marginLeft: '8px',
  } as React.CSSProperties,
  freezeButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#17a2b8',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } as React.CSSProperties,
  freezeButtonDisabled: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#6c757d',
    color: 'white',
    cursor: 'not-allowed',
    fontSize: '14px',
    opacity: 0.6,
  } as React.CSSProperties,

  // Badge styles
  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '16px',
    padding: '16px',
  } as React.CSSProperties,
  badgeCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  } as React.CSSProperties,
  badgeCardLocked: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    cursor: 'pointer',
    opacity: 0.6,
    filter: 'grayscale(100%)',
  } as React.CSSProperties,
  badgeIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginBottom: '8px',
    backgroundColor: '#e9ecef',
  } as React.CSSProperties,
  badgeName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#212529',
    textAlign: 'center' as const,
    marginBottom: '4px',
  } as React.CSSProperties,
  badgeRarity: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  badgeStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  badgeStat: {
    textAlign: 'center' as const,
  } as React.CSSProperties,
  badgeStatValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#212529',
  } as React.CSSProperties,
  badgeStatLabel: {
    fontSize: '12px',
    color: '#6c757d',
  } as React.CSSProperties,

  // Level/Tier styles
  levelContainer: {
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  } as React.CSSProperties,
  levelHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,
  levelIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    marginRight: '12px',
    backgroundColor: '#e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  } as React.CSSProperties,
  levelInfo: {
    flex: 1,
  } as React.CSSProperties,
  levelTierName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#212529',
  } as React.CSSProperties,
  levelPoints: {
    fontSize: '14px',
    color: '#6c757d',
  } as React.CSSProperties,
  levelProgressContainer: {
    marginTop: '12px',
  } as React.CSSProperties,
  levelProgressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    fontSize: '13px',
  } as React.CSSProperties,
  levelProgressBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px',
    overflow: 'hidden',
  } as React.CSSProperties,
  levelProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  levelBenefits: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  } as React.CSSProperties,
  levelBenefitsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212529',
    marginBottom: '8px',
  } as React.CSSProperties,
  levelBenefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    fontSize: '13px',
    color: '#495057',
  } as React.CSSProperties,
  levelBenefitItem: {
    padding: '4px 0',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,

  // Reward store styles
  rewardStoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    padding: '16px',
  } as React.CSSProperties,
  rewardCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    overflow: 'hidden',
  } as React.CSSProperties,
  rewardCardUnavailable: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    overflow: 'hidden',
    opacity: 0.7,
  } as React.CSSProperties,
  rewardImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover' as const,
    backgroundColor: '#e9ecef',
  } as React.CSSProperties,
  rewardContent: {
    padding: '12px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  rewardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529',
    marginBottom: '4px',
  } as React.CSSProperties,
  rewardDescription: {
    fontSize: '13px',
    color: '#6c757d',
    marginBottom: '8px',
    flex: 1,
  } as React.CSSProperties,
  rewardCost: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0d6efd',
    marginBottom: '8px',
  } as React.CSSProperties,
  rewardButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#0d6efd',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
  } as React.CSSProperties,
  rewardButtonDisabled: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#6c757d',
    color: 'white',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
  } as React.CSSProperties,
  rewardPointsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  rewardPointsLabel: {
    fontSize: '14px',
    color: '#6c757d',
  } as React.CSSProperties,
  rewardPointsValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#212529',
  } as React.CSSProperties,

  // Accordion/Expandable quest styles
  questAccordion: {
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '8px',
  } as React.CSSProperties,
  questAccordionHeader: {
    width: '100%',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
  } as React.CSSProperties,
  questAccordionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  } as React.CSSProperties,
  questAccordionInfo: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  questAccordionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  } as React.CSSProperties,
  questAccordionName: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#212529',
  } as React.CSSProperties,
  questAccordionStatusBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontWeight: '500',
  } as React.CSSProperties,
  questAccordionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#6c757d',
  } as React.CSSProperties,
  questAccordionChevron: {
    color: '#6c757d',
    transition: 'transform 0.2s',
    flexShrink: 0,
  } as React.CSSProperties,
  questAccordionContent: {
    padding: '0 12px 12px',
    overflow: 'hidden',
  } as React.CSSProperties,
};

/**
 * Helper function to get status badge colors
 */
function getStatusColors(status: string): { bg: string; color: string } {
  switch (status) {
    case 'completed':
      return { bg: '#d4edda', color: '#155724' };
    case 'in_progress':
      return { bg: '#cce5ff', color: '#004085' };
    case 'active':
      return { bg: '#cce5ff', color: '#004085' };
    case 'frozen':
      return { bg: '#cce5ff', color: '#17a2b8' };
    case 'at_risk':
      return { bg: '#fff3cd', color: '#856404' };
    case 'broken':
      return { bg: '#f8d7da', color: '#721c24' };
    default:
      return { bg: '#e9ecef', color: '#6c757d' };
  }
}

/**
 * Helper function to get rarity colors
 */
function getRarityColors(rarity: BadgeRarity): { bg: string; color: string } {
  switch (rarity) {
    case 'COMMON':
      return { bg: '#e9ecef', color: '#495057' };
    case 'RARE':
      return { bg: '#cce5ff', color: '#004085' };
    case 'EPIC':
      return { bg: '#e2d5f1', color: '#6f42c1' };
    case 'LEGENDARY':
      return { bg: '#fff3cd', color: '#856404' };
    default:
      return { bg: '#e9ecef', color: '#6c757d' };
  }
}

/**
 * Props for QuestProgress component
 */
export interface QuestProgressProps {
  /** Specific quest ID to display (shows all if not provided) */
  questId?: string;
  /** Hide completed quests */
  hideCompleted?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Enable expandable accordion mode (default: true) */
  expandable?: boolean;
  /** Default expanded quest ID (defaults to first in-progress) */
  defaultExpandedId?: string;
  /** Show XP reward in header (default: true) */
  showXpReward?: boolean;
  /** Callback when a quest is completed */
  onComplete?: (quest: QuestWithProgress) => void;
  /** Theme customization */
  theme?: {
    cardBackground?: string;
    cardBorder?: string;
    progressColor?: string;
    textColor?: string;
  };
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
  /** Custom render for each quest */
  renderQuest?: (quest: QuestWithProgress) => React.ReactNode;
}

/**
 * QuestProgress - Display quest progress with step checklist
 *
 * Shows quest name, description, progress bar, and step completion status.
 *
 * @example
 * ```tsx
 * <QuestProgress hideCompleted onComplete={(quest) => console.log('Completed:', quest.name)} />
 * ```
 */
function QuestProgressInner({
  questId,
  hideCompleted = false,
  className,
  style,
  expandable = true,
  defaultExpandedId,
  showXpReward = true,
  onComplete,
  theme,
  renderLoading,
  renderError,
  renderQuest,
}: QuestProgressProps) {
  const { quests, loading, error, refresh } = useQuests({ autoRefresh: true });
  const previousQuests = useRef<Map<string, QuestWithProgress>>(new Map());
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Track completions
  useEffect(() => {
    if (onComplete) {
      quests.forEach((quest) => {
        const prev = previousQuests.current.get(quest.id);
        if (prev && prev.status !== 'completed' && quest.status === 'completed') {
          onComplete(quest);
        }
      });
    }
    // Update previous state
    const newMap = new Map<string, QuestWithProgress>();
    quests.forEach((q) => newMap.set(q.id, q));
    previousQuests.current = newMap;
  }, [quests, onComplete]);

  // Set default expanded quest (first in-progress or provided ID)
  useEffect(() => {
    if (quests.length > 0 && expandedQuestId === null) {
      if (defaultExpandedId) {
        setExpandedQuestId(defaultExpandedId);
      } else {
        const inProgressQuest = quests.find((q) => q.status === 'in_progress');
        setExpandedQuestId(inProgressQuest?.id ?? null);
      }
    }
  }, [quests, defaultExpandedId, expandedQuestId]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  let filteredQuests = quests;
  if (questId) {
    filteredQuests = quests.filter((q) => q.id === questId);
  }
  if (hideCompleted) {
    filteredQuests = filteredQuests.filter((q) => q.status !== 'completed');
  }

  if (filteredQuests.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#6c757d' }}>
        <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.5 }}>🎯</span>
        <p>No quests available</p>
      </div>
    );
  }

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return { backgroundColor: 'rgba(40, 167, 69, 0.2)', color: '#28a745' };
      case 'in_progress':
        return { backgroundColor: 'rgba(13, 110, 253, 0.2)', color: '#0d6efd' };
      default:
        return { backgroundColor: '#f8f9fa', color: '#6c757d' };
    }
  };

  const getQuestBgStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'completed':
        return { backgroundColor: 'rgba(40, 167, 69, 0.05)', borderColor: 'rgba(40, 167, 69, 0.2)' };
      case 'in_progress':
        return { backgroundColor: 'rgba(13, 110, 253, 0.05)', borderColor: 'rgba(13, 110, 253, 0.2)' };
      default:
        return { backgroundColor: '#f8f9fa', borderColor: '#e9ecef' };
    }
  };

  const toggleExpand = (id: string) => {
    if (!expandable) return;
    setExpandedQuestId(expandedQuestId === id ? null : id);
  };

  return (
    <div className={className} style={{ ...style, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <AnimatePresenceWrapper mode="popLayout">
        {filteredQuests.map((quest) => {
          if (renderQuest) {
            return <div key={quest.id}>{renderQuest(quest)}</div>;
          }

          const isExpanded = !expandable || expandedQuestId === quest.id;
          const statusBadgeStyle = getStatusBadgeStyle(quest.status);
          const questBgStyle = getQuestBgStyle(quest.status);

          const questContent = (
            <div
              style={{
                ...gamificationStyles.questAccordion,
                border: '1px solid',
                ...questBgStyle,
                ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
                ...(theme?.cardBorder && { borderColor: theme.cardBorder }),
              }}
            >
              {/* Quest Header */}
              <button
                type="button"
                onClick={() => toggleExpand(quest.id)}
                style={{
                  ...gamificationStyles.questAccordionHeader,
                  cursor: expandable ? 'pointer' : 'default',
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    ...gamificationStyles.questAccordionIcon,
                    backgroundColor: quest.status === 'completed' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(13, 110, 253, 0.2)',
                  }}
                >
                  {quest.status === 'completed' ? (
                    <span style={{ color: '#28a745' }}>✓</span>
                  ) : (
                    <span style={{ color: '#0d6efd' }}>🎯</span>
                  )}
                </div>

                {/* Title & Meta */}
                <div style={gamificationStyles.questAccordionInfo}>
                  <div style={gamificationStyles.questAccordionTitle}>
                    <span style={{ ...gamificationStyles.questAccordionName, ...(theme?.textColor && { color: theme.textColor }) }}>
                      {quest.name}
                    </span>
                    <span
                      style={{
                        ...gamificationStyles.questAccordionStatusBadge,
                        ...statusBadgeStyle,
                      }}
                    >
                      {quest.status === 'completed'
                        ? 'Complete'
                        : quest.status === 'in_progress'
                        ? `${quest.percentComplete}%`
                        : 'Not Started'}
                    </span>
                  </div>
                  <div style={gamificationStyles.questAccordionMeta}>
                    {showXpReward && quest.xpReward > 0 && (
                      <>
                        <span>⭐</span>
                        <span>+{quest.xpReward} XP</span>
                        <span style={{ color: '#e9ecef' }}>|</span>
                      </>
                    )}
                    <span>{quest.steps.length} steps</span>
                  </div>
                </div>

                {/* Chevron */}
                {expandable && (
                  <span
                    style={{
                      ...gamificationStyles.questAccordionChevron,
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ▶
                  </span>
                )}
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div style={gamificationStyles.questAccordionContent}>
                  {/* Progress Bar */}
                  {quest.status !== 'completed' && (
                    <div style={{ ...gamificationStyles.questProgressBar, marginBottom: '12px', height: '6px' }}>
                      <div
                        style={{
                          ...gamificationStyles.questProgressFill,
                          width: `${quest.percentComplete}%`,
                          ...(theme?.progressColor && { backgroundColor: theme.progressColor }),
                        }}
                      />
                    </div>
                  )}

                  {/* Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {quest.steps.map((step, index) => (
                      <div
                        key={step.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          padding: '8px',
                          borderRadius: '6px',
                          opacity: step.completed ? 0.6 : 1,
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                            backgroundColor: step.completed ? 'rgba(40, 167, 69, 0.2)' : '#f8f9fa',
                            color: step.completed ? '#28a745' : '#6c757d',
                          }}
                        >
                          {step.completed ? '✓' : index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              textDecoration: step.completed ? 'line-through' : 'none',
                              color: step.completed ? '#6c757d' : '#212529',
                            }}
                          >
                            {step.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>
                            {step.currentCount}/{step.requiredCount}
                            {step.requiredCount > 1 && !step.completed && (
                              <span style={{ marginLeft: '8px' }}>
                                ({Math.round((step.currentCount / step.requiredCount) * 100)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );

          // Wrap with motion if available
          if (MotionDiv !== 'div') {
            const Motion = MotionDiv as MotionComponent;
            return (
              <Motion
                key={quest.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                {questContent}
              </Motion>
            );
          }

          return <div key={quest.id}>{questContent}</div>;
        })}
      </AnimatePresenceWrapper>
    </div>
  );
}

export const QuestProgress = withErrorBoundary(QuestProgressInner);

// ============================================
// Issue #32: Streak Components
// ============================================

/**
 * Props for StreakFlame component
 */
export interface StreakFlameProps {
  /** Specific streak rule ID to display */
  ruleId?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show freeze button */
  showFreezeButton?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Callback when freeze is used */
  onFreeze?: (ruleId: string, remainingFreezes: number) => void;
  /** Theme customization */
  theme?: {
    flameColor?: string;
    countColor?: string;
    cardBackground?: string;
  };
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
}

/**
 * StreakFlame - Display streak counter with flame icon
 *
 * Shows current streak count with status indicator and optional freeze button.
 *
 * @example
 * ```tsx
 * <StreakFlame showFreezeButton onFreeze={(id, remaining) => console.log('Freeze used')} />
 * ```
 */
function StreakFlameInner({
  ruleId,
  size = 'md',
  showFreezeButton = true,
  className,
  style,
  onFreeze,
  theme,
  renderLoading,
  renderError,
}: StreakFlameProps) {
  const { streaks, stats, loading, error, freeze, refresh } = useStreaks({ autoRefresh: true });
  const [freezing, setFreezing] = useState(false);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  let displayStreaks = streaks;
  if (ruleId) {
    displayStreaks = streaks.filter((s) => s.id === ruleId);
  }

  if (displayStreaks.length === 0) {
    return <div style={{ textAlign: 'center', padding: '16px', color: '#6c757d' }}>No streaks available</div>;
  }

  const sizeStyles = {
    sm: { flame: '24px', count: '20px', container: '12px' },
    md: { flame: '32px', count: '28px', container: '16px' },
    lg: { flame: '48px', count: '40px', container: '20px' },
  };

  const handleFreeze = async (streakId: string) => {
    setFreezing(true);
    try {
      const result = await freeze(streakId);
      if (result && onFreeze) {
        onFreeze(streakId, result.remainingFreezes);
      }
    } finally {
      setFreezing(false);
    }
  };

  return (
    <div className={className} style={style}>
      {displayStreaks.map((streak) => {
        const statusColors = getStatusColors(streak.status);
        const canFreeze = streak.freezeInventory > 0 && !streak.freezeUsedToday;

        return (
          <div
            key={streak.id}
            style={{
              ...gamificationStyles.streakContainer,
              padding: sizeStyles[size].container,
              ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
            }}
          >
            <span
              style={{
                ...gamificationStyles.streakFlame,
                fontSize: sizeStyles[size].flame,
                ...(theme?.flameColor && { color: theme.flameColor }),
              }}
            >
              🔥
            </span>
            <span
              style={{
                ...gamificationStyles.streakCount,
                fontSize: sizeStyles[size].count,
                ...(theme?.countColor && { color: theme.countColor }),
              }}
            >
              {streak.currentCount}
            </span>
            <div style={gamificationStyles.streakInfo}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={gamificationStyles.streakName}>{streak.name}</span>
                <span
                  style={{
                    ...gamificationStyles.streakStatus,
                    backgroundColor: statusColors.bg,
                    color: statusColors.color,
                  }}
                >
                  {streak.status}
                </span>
              </div>
              <span style={gamificationStyles.streakLabel}>
                Best: {streak.maxStreak} days
              </span>
            </div>
            {showFreezeButton && (
              <button
                type="button"
                onClick={() => void handleFreeze(streak.id)}
                disabled={!canFreeze || freezing}
                style={canFreeze ? gamificationStyles.freezeButton : gamificationStyles.freezeButtonDisabled}
              >
                <span>❄️</span>
                <span>{streak.freezeInventory}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const StreakFlame = withErrorBoundary(StreakFlameInner);

// ============================================
// Issue #33: Badge Components
// ============================================

/**
 * Props for BadgeGrid component
 */
export interface BadgeGridProps {
  /** Show locked (unearned) badges */
  showLocked?: boolean;
  /** Filter by category */
  category?: string;
  /** Number of grid columns */
  columns?: number;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Show progress summary header (default: true) */
  showProgressSummary?: boolean;
  /** Show filter tabs (All/Earned/Locked) (default: true) */
  showFilterTabs?: boolean;
  /** @deprecated Use showProgressSummary instead */
  showStats?: boolean;
  /** Callback when a badge is clicked */
  onBadgeClick?: (badge: BadgeWithStatus) => void;
  /** Theme customization */
  theme?: {
    cardBackground?: string;
    cardBorder?: string;
  };
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
  /** Custom render for each badge */
  renderBadge?: (badge: BadgeWithStatus) => React.ReactNode;
}

/**
 * BadgeGrid - Display badge collection in a grid
 *
 * Shows badges with unlock status, rarity indicators, and optional filtering.
 *
 * @example
 * ```tsx
 * <BadgeGrid showLocked showStats onBadgeClick={(badge) => showBadgeModal(badge)} />
 * ```
 */
function BadgeGridInner({
  showLocked = true,
  category,
  columns = 2,
  className,
  style,
  showProgressSummary = true,
  showFilterTabs = true,
  showStats, // deprecated, use showProgressSummary
  onBadgeClick,
  theme,
  renderLoading,
  renderError,
  renderBadge,
}: BadgeGridProps) {
  const { badges, stats, loading, error, refresh } = useBadges({ autoRefresh: true, category });
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Handle deprecated prop
  const shouldShowSummary = showProgressSummary ?? showStats ?? true;

  useEffect(() => {
    void refresh(category);
  }, [refresh, category]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  // Filter badges based on tab selection
  let displayBadges = badges;
  if (filter === 'unlocked') {
    displayBadges = badges.filter((b) => b.isUnlocked);
  } else if (filter === 'locked') {
    displayBadges = badges.filter((b) => !b.isUnlocked);
  } else if (!showLocked) {
    displayBadges = badges.filter((b) => b.isUnlocked);
  }

  // Updated rarity color scheme matching playground
  const getPlaygroundRarityColors = (rarity: BadgeRarity): { color: string; bg: string } => {
    switch (rarity) {
      case 'LEGENDARY':
        return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'EPIC':
        return { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'RARE':
        return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'COMMON':
      default:
        return { color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)' };
    }
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: '12px',
    padding: '0',
  };

  const unlockedCount = stats?.unlocked ?? badges.filter((b) => b.isUnlocked).length;
  const totalCount = stats?.total ?? badges.length;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className={className} style={{ ...style, padding: '16px' }}>
      {/* Progress Summary */}
      {shouldShowSummary && (
        <div style={defaultStyles.progressSummary}>
          <div style={defaultStyles.progressSummaryLeft}>
            <div style={defaultStyles.progressSummaryIcon}>✨</div>
            <div>
              <div style={defaultStyles.progressSummaryText}>{unlockedCount} / {totalCount}</div>
              <div style={defaultStyles.progressSummarySubtext}>Badges Earned</div>
            </div>
          </div>
          <div style={defaultStyles.progressSummaryBar}>
            <div
              style={{
                ...defaultStyles.progressSummaryBarFill,
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {showFilterTabs && (
        <div style={defaultStyles.filterTabs}>
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={filter === f ? defaultStyles.filterTabActive : defaultStyles.filterTab}
            >
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Earned' : 'Locked'}
            </button>
          ))}
        </div>
      )}

      {/* Badge Grid */}
      <div style={gridStyle}>
        <AnimatePresenceWrapper mode="popLayout">
          {displayBadges.map((badge) => {
            if (renderBadge) {
              return <div key={badge.id}>{renderBadge(badge)}</div>;
            }

            const rarityColors = getPlaygroundRarityColors(badge.rarity);

            const badgeContent = (
              <div
                style={{
                  position: 'relative',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  cursor: onBadgeClick ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  ...(badge.isUnlocked
                    ? {
                        backgroundColor: rarityColors.bg,
                        borderColor: `${rarityColors.color}40`,
                        ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
                        ...(theme?.cardBorder && { borderColor: theme.cardBorder }),
                      }
                    : {
                        backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        borderColor: '#e9ecef',
                        opacity: 0.6,
                      }),
                }}
                onClick={() => onBadgeClick?.(badge)}
                onKeyDown={(e) => e.key === 'Enter' && onBadgeClick?.(badge)}
                role={onBadgeClick ? 'button' : undefined}
                tabIndex={onBadgeClick ? 0 : undefined}
              >
                {/* Checkmark for unlocked */}
                {badge.isUnlocked && (
                  <div style={defaultStyles.badgeCheckmark}>✓</div>
                )}

                {/* Badge Icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: badge.isUnlocked ? `${rarityColors.color}20` : '#f8f9fa',
                    }}
                  >
                    {badge.iconUrl ? (
                      <img
                        src={badge.iconUrl}
                        alt={badge.name}
                        style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                      />
                    ) : badge.isUnlocked ? (
                      <span style={{ color: rarityColors.color }}>🏅</span>
                    ) : (
                      <span style={{ color: '#6c757d' }}>🔒</span>
                    )}
                  </div>
                </div>

                {/* Badge Info */}
                <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#212529' }}>
                  {badge.name}
                </h4>
                {badge.description && (
                  <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px', lineHeight: 1.4 }}>
                    {badge.description}
                  </p>
                )}

                {/* Rarity Badge */}
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    fontWeight: '500',
                    backgroundColor: `${rarityColors.color}20`,
                    color: rarityColors.color,
                  }}
                >
                  {badge.rarity}
                </span>

              </div>
            );

            // Wrap with motion if available
            if (MotionDiv !== 'div') {
              const Motion = MotionDiv as MotionComponent;
              return (
                <Motion
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {badgeContent}
                </Motion>
              );
            }

            return <div key={badge.id}>{badgeContent}</div>;
          })}
        </AnimatePresenceWrapper>
      </div>

      {/* Empty State */}
      {displayBadges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#6c757d' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px', opacity: 0.5 }}>🏅</span>
          <p>No badges found</p>
        </div>
      )}
    </div>
  );
}

export const BadgeGrid = withErrorBoundary(BadgeGridInner);

// ============================================
// Issue #15: Level/Tier Components
// ============================================

/**
 * Props for LevelProgress component
 */
export interface LevelProgressProps {
  /** Show progress to next tier */
  showNextTier?: boolean;
  /** Show tier benefits */
  showBenefits?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Theme customization */
  theme?: {
    cardBackground?: string;
    progressGradient?: string;
    textColor?: string;
  };
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
}

/**
 * LevelProgress - Display tier/level progress
 *
 * Shows current tier, XP/points, and progress to next tier.
 *
 * @example
 * ```tsx
 * <LevelProgress showNextTier showBenefits />
 * ```
 */
function LevelProgressInner({
  showNextTier = true,
  showBenefits = false,
  className,
  style,
  theme,
  renderLoading,
  renderError,
}: LevelProgressProps) {
  const { profile, loading, error, refreshProfile } = useLoyalty({ autoRefresh: true });

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  if (!profile) {
    return null;
  }

  const progressPercent = profile.nextTier
    ? Math.min(100, ((profile.points) / (profile.nextTier.minPoints)) * 100)
    : 100;

  const containerStyle = {
    ...gamificationStyles.levelContainer,
    ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
  };

  const progressFillStyle = {
    ...gamificationStyles.levelProgressFill,
    width: `${progressPercent}%`,
    ...(theme?.progressGradient && { background: theme.progressGradient }),
  };

  return (
    <div className={className} style={{ ...containerStyle, ...style }}>
      <div style={gamificationStyles.levelHeader}>
        <div
          style={{
            ...gamificationStyles.levelIcon,
            ...(profile.tier?.color && { backgroundColor: profile.tier.color }),
          }}
        >
          {profile.tier?.iconUrl ? (
            <img
              src={profile.tier.iconUrl}
              alt={profile.tier.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%' }}
            />
          ) : (
            '⭐'
          )}
        </div>
        <div style={gamificationStyles.levelInfo}>
          <div
            style={{
              ...gamificationStyles.levelTierName,
              ...(theme?.textColor && { color: theme.textColor }),
            }}
          >
            {profile.tier?.name ?? 'No Tier'}
          </div>
          <div style={gamificationStyles.levelPoints}>
            {profile.points.toLocaleString()} points
          </div>
        </div>
      </div>

      {showNextTier && profile.nextTier && (
        <div style={gamificationStyles.levelProgressContainer}>
          <div style={gamificationStyles.levelProgressHeader}>
            <span style={{ color: '#6c757d' }}>Progress to {profile.nextTier.name}</span>
            <span style={{ fontWeight: '500' }}>
              {profile.nextTier.pointsNeeded.toLocaleString()} points needed
            </span>
          </div>
          <div style={gamificationStyles.levelProgressBar}>
            <div style={progressFillStyle} />
          </div>
        </div>
      )}

      {showBenefits && profile.tier?.benefits && Object.keys(profile.tier.benefits).length > 0 && (
        <div style={gamificationStyles.levelBenefits}>
          <div style={gamificationStyles.levelBenefitsTitle}>Your Benefits</div>
          <ul style={gamificationStyles.levelBenefitsList}>
            {Object.entries(profile.tier.benefits).map(([key, value]) => (
              <li key={key} style={gamificationStyles.levelBenefitItem}>
                <span style={{ marginRight: '8px', color: '#28a745' }}>✓</span>
                {String(value)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const LevelProgress = withErrorBoundary(LevelProgressInner);

// ============================================
// Issue #34: Reward Components
// ============================================

/**
 * Props for RewardStore component
 */
export interface RewardStoreProps {
  /** Show unavailable items */
  showUnavailable?: boolean;
  /** Custom CSS class name */
  className?: string;
  /** Custom styles override */
  style?: React.CSSProperties;
  /** Show points header */
  showPointsHeader?: boolean;
  /** Callback when item is redeemed */
  onRedeem?: (item: RewardItem, result: RedemptionResult) => void;
  /** Theme customization */
  theme?: {
    cardBackground?: string;
    buttonColor?: string;
  };
  /** Custom render for loading state */
  renderLoading?: () => React.ReactNode;
  /** Custom render for error state */
  renderError?: (error: string) => React.ReactNode;
  /** Custom render for each item */
  renderItem?: (item: RewardItem, onRedeem: () => void) => React.ReactNode;
}

/**
 * RewardStore - Display reward catalog with redeem functionality
 *
 * Shows available rewards with point costs and redeem buttons.
 *
 * @example
 * ```tsx
 * <RewardStore
 *   showPointsHeader
 *   onRedeem={(item, result) => {
 *     if (result.success) toast.success(`Redeemed ${item.name}!`);
 *   }}
 * />
 * ```
 */
function RewardStoreInner({
  showUnavailable = true,
  className,
  style,
  showPointsHeader = true,
  onRedeem,
  theme,
  renderLoading,
  renderError,
  renderItem,
}: RewardStoreProps) {
  const { items, userPoints, loading, error, redeem, refresh } = useRewards({ autoRefresh: true });
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading && items.length === 0) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  let displayItems = items;
  if (!showUnavailable) {
    displayItems = items.filter((i) => i.isAvailable);
  }

  const handleRedeem = async (item: RewardItem) => {
    setRedeemingId(item.id);
    try {
      const result = await redeem(item.id);
      if (result && onRedeem) {
        onRedeem(item, result);
      }
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className={className} style={style}>
      {showPointsHeader && (
        <div style={gamificationStyles.rewardPointsHeader}>
          <span style={gamificationStyles.rewardPointsLabel}>Your Points</span>
          <span style={gamificationStyles.rewardPointsValue}>{userPoints.toLocaleString()}</span>
        </div>
      )}

      <div style={gamificationStyles.rewardStoreGrid}>
        {displayItems.map((item) => {
          if (renderItem) {
            return <div key={item.id}>{renderItem(item, () => void handleRedeem(item))}</div>;
          }

          const cardStyle = item.isAvailable
            ? {
                ...gamificationStyles.rewardCard,
                ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
              }
            : gamificationStyles.rewardCardUnavailable;

          const buttonStyle = item.isAvailable && item.canAfford
            ? {
                ...gamificationStyles.rewardButton,
                ...(theme?.buttonColor && { backgroundColor: theme.buttonColor }),
              }
            : gamificationStyles.rewardButtonDisabled;

          const isRedeeming = redeemingId === item.id;

          return (
            <div key={item.id} style={cardStyle}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={gamificationStyles.rewardImage} />
              ) : (
                <div style={{ ...gamificationStyles.rewardImage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                  🎁
                </div>
              )}
              <div style={gamificationStyles.rewardContent}>
                <span style={gamificationStyles.rewardName}>{item.name}</span>
                {item.description && (
                  <span style={gamificationStyles.rewardDescription}>{item.description}</span>
                )}
                <span style={gamificationStyles.rewardCost}>
                  {item.pointsCost.toLocaleString()} points
                </span>
                {item.requiredBadgeName && !item.hasBadge && (
                  <span style={{ fontSize: '12px', color: '#dc3545', marginBottom: '8px' }}>
                    Requires: {item.requiredBadgeName}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void handleRedeem(item)}
                  disabled={!item.isAvailable || !item.canAfford || isRedeeming}
                  style={buttonStyle}
                >
                  {isRedeeming
                    ? 'Redeeming...'
                    : item.canAfford
                    ? 'Redeem'
                    : `Need ${(item.pointsCost - userPoints).toLocaleString()} more`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const RewardStore = withErrorBoundary(RewardStoreInner);
