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
  renderLoading,
  renderError,
}: AffiliateStatsProps) {
  const { stats, loading, error, refreshStats } = useAffiliateStats({ autoRefresh });

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

  const labelStyle = {
    ...defaultStyles.statsLabel,
    ...(theme?.labelColor && { color: theme.labelColor }),
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className={className} style={{ ...defaultStyles.statsContainer, ...style }}>
      <div style={cardStyle}>
        <div style={valueStyle}>{stats.referralCount}</div>
        <div style={labelStyle}>Referrals</div>
      </div>
      <div style={cardStyle}>
        <div style={valueStyle}>{stats.earnings.transactionCount}</div>
        <div style={labelStyle}>Commissions</div>
      </div>
      <div style={cardStyle}>
        <div style={valueStyle}>{formatCurrency(stats.earnings.totalEarned)}</div>
        <div style={labelStyle}>Earnings</div>
      </div>
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

  const getRowStyle = (isCurrentUser: boolean) => ({
    ...(isCurrentUser ? defaultStyles.leaderboardRowHighlighted : defaultStyles.leaderboardRow),
    ...(theme?.rowBackground && !isCurrentUser && { backgroundColor: theme.rowBackground }),
    ...(theme?.highlightBackground && isCurrentUser && { backgroundColor: theme.highlightBackground }),
  });

  const textStyle = theme?.textColor ? { color: theme.textColor } : {};
  const secondaryStyle = theme?.secondaryColor
    ? { ...defaultStyles.leaderboardStats, color: theme.secondaryColor }
    : defaultStyles.leaderboardStats;

  return (
    <div className={className} style={{ ...defaultStyles.leaderboardContainer, ...style }}>
      <ol style={defaultStyles.leaderboardList}>
        {leaderboard.entries.map((entry) => {
          const isCurrentUser = currentUserId === entry.userId;

          if (renderRow) {
            return <li key={entry.userId}>{renderRow(entry, isCurrentUser)}</li>;
          }

          return (
            <li key={entry.userId} style={getRowStyle(isCurrentUser)}>
              <span style={{ ...defaultStyles.leaderboardRank, ...textStyle }}>#{entry.rank}</span>
              <span style={{ ...defaultStyles.leaderboardName, ...textStyle }}>
                {entry.displayName ?? `User ${entry.userId.slice(0, 8)}`}
              </span>
              <span style={secondaryStyle}>
                {entry.referralCount} referrals
              </span>
            </li>
          );
        })}
      </ol>
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
  theme,
  onCopy,
  onShare,
}: ReferralLinkProps) {
  const { stats } = useAffiliateStats({ autoRefresh: true });
  const [copied, setCopied] = useState(false);

  const referralCode = stats?.referralCode;

  if (!referralCode) {
    return null;
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl ?? origin}?ref=${referralCode}`;

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

  return (
    <div className={className} style={{ ...defaultStyles.referralContainer, ...style }}>
      <input
        type="text"
        readOnly
        value={referralLink}
        style={inputStyle}
        onClick={(e) => (e.target as HTMLInputElement).select()}
      />
      <button type="button" onClick={handleCopy} style={buttonStyle}>
        {copied ? copiedText : copyButtonText}
      </button>
      {showShareButton && canShare && (
        <button type="button" onClick={handleShare} style={buttonStyle}>
          {shareButtonText}
        </button>
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
  onComplete,
  theme,
  renderLoading,
  renderError,
  renderQuest,
}: QuestProgressProps) {
  const { quests, loading, error, refresh } = useQuests({ autoRefresh: true });
  const previousQuests = useRef<Map<string, QuestWithProgress>>(new Map());

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
    return <div style={{ textAlign: 'center', padding: '16px', color: '#6c757d' }}>No quests available</div>;
  }

  const cardStyle = {
    ...gamificationStyles.questContainer,
    ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
    ...(theme?.cardBorder && { border: `1px solid ${theme.cardBorder}` }),
  };

  return (
    <div className={className} style={style}>
      {filteredQuests.map((quest) => {
        if (renderQuest) {
          return <div key={quest.id}>{renderQuest(quest)}</div>;
        }

        const statusColors = getStatusColors(quest.status);

        return (
          <div key={quest.id} style={cardStyle}>
            <div style={gamificationStyles.questHeader}>
              <div>
                <h3 style={{ ...gamificationStyles.questTitle, ...(theme?.textColor && { color: theme.textColor }) }}>
                  {quest.name}
                </h3>
                {quest.description && (
                  <p style={gamificationStyles.questDescription}>{quest.description}</p>
                )}
              </div>
              <span
                style={{
                  ...gamificationStyles.questBadge,
                  backgroundColor: statusColors.bg,
                  color: statusColors.color,
                }}
              >
                {quest.status.replace('_', ' ')}
              </span>
            </div>

            <div style={gamificationStyles.questProgressBar}>
              <div
                style={{
                  ...gamificationStyles.questProgressFill,
                  width: `${quest.percentComplete}%`,
                  ...(theme?.progressColor && { backgroundColor: theme.progressColor }),
                }}
              />
            </div>

            <ul style={gamificationStyles.questStepList}>
              {quest.steps.map((step) => (
                <li key={step.id} style={gamificationStyles.questStep}>
                  <span
                    style={{
                      ...gamificationStyles.questStepIcon,
                      backgroundColor: step.completed ? '#d4edda' : '#e9ecef',
                      color: step.completed ? '#155724' : '#6c757d',
                    }}
                  >
                    {step.completed ? '✓' : step.order}
                  </span>
                  <span
                    style={{
                      ...gamificationStyles.questStepText,
                      textDecoration: step.completed ? 'line-through' : 'none',
                      color: step.completed ? '#6c757d' : '#212529',
                    }}
                  >
                    {step.name}
                  </span>
                  <span style={gamificationStyles.questStepCount}>
                    {step.currentCount}/{step.requiredCount}
                  </span>
                </li>
              ))}
            </ul>

            {quest.xpReward > 0 && (
              <div style={gamificationStyles.questReward}>
                <span style={{ marginRight: '6px' }}>⭐</span>
                {quest.xpReward} XP reward
                {quest.badgeReward && ` + Badge`}
              </div>
            )}
          </div>
        );
      })}
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
  /** Show stats header */
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
  columns = 4,
  className,
  style,
  showStats = true,
  onBadgeClick,
  theme,
  renderLoading,
  renderError,
  renderBadge,
}: BadgeGridProps) {
  const { badges, stats, loading, error, refresh } = useBadges({ autoRefresh: true, category });

  useEffect(() => {
    void refresh(category);
  }, [refresh, category]);

  if (loading) {
    return renderLoading ? renderLoading() : <div style={{ textAlign: 'center', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return renderError ? renderError(error) : <div style={{ color: 'red', padding: '16px' }}>{error}</div>;
  }

  let displayBadges = badges;
  if (!showLocked) {
    displayBadges = badges.filter((b) => b.isUnlocked);
  }

  const gridStyle = {
    ...gamificationStyles.badgeGrid,
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
  };

  return (
    <div className={className} style={style}>
      {showStats && stats && (
        <div style={gamificationStyles.badgeStats}>
          <div style={gamificationStyles.badgeStat}>
            <div style={gamificationStyles.badgeStatValue}>{stats.unlocked}</div>
            <div style={gamificationStyles.badgeStatLabel}>Unlocked</div>
          </div>
          <div style={gamificationStyles.badgeStat}>
            <div style={gamificationStyles.badgeStatValue}>{stats.total}</div>
            <div style={gamificationStyles.badgeStatLabel}>Total</div>
          </div>
          <div style={gamificationStyles.badgeStat}>
            <div style={gamificationStyles.badgeStatValue}>
              {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
            </div>
            <div style={gamificationStyles.badgeStatLabel}>Progress</div>
          </div>
        </div>
      )}

      <div style={gridStyle}>
        {displayBadges.map((badge) => {
          if (renderBadge) {
            return <div key={badge.id}>{renderBadge(badge)}</div>;
          }

          const rarityColors = getRarityColors(badge.rarity);
          const cardStyle = badge.isUnlocked
            ? {
                ...gamificationStyles.badgeCard,
                ...(theme?.cardBackground && { backgroundColor: theme.cardBackground }),
                ...(theme?.cardBorder && { border: `1px solid ${theme.cardBorder}` }),
              }
            : gamificationStyles.badgeCardLocked;

          return (
            <div
              key={badge.id}
              style={cardStyle}
              onClick={() => onBadgeClick?.(badge)}
              onKeyDown={(e) => e.key === 'Enter' && onBadgeClick?.(badge)}
              role="button"
              tabIndex={0}
            >
              {badge.iconUrl ? (
                <img src={badge.iconUrl} alt={badge.name} style={gamificationStyles.badgeIcon} />
              ) : (
                <div style={gamificationStyles.badgeIcon}>
                  {badge.isUnlocked ? '🏆' : '🔒'}
                </div>
              )}
              <span style={gamificationStyles.badgeName}>{badge.name}</span>
              <span
                style={{
                  ...gamificationStyles.badgeRarity,
                  backgroundColor: rarityColors.bg,
                  color: rarityColors.color,
                }}
              >
                {badge.rarity}
              </span>
            </div>
          );
        })}
      </div>
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
