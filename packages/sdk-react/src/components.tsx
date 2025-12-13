'use client';

import React, { useEffect, useRef, useState, cloneElement } from 'react';
import { useTrack, useAffiliateStats, useLeaderboard, useReferral } from './hooks.js';
import type { AffiliateStats, LeaderboardEntry } from '@gamify/core';

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
export function AffiliateStats({
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

  if (!stats) {
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
export function Leaderboard({
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
export function ReferralLink({
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
