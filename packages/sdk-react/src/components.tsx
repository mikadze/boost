'use client';

import { useEffect, useRef } from 'react';
import { useTrack } from './hooks.js';

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
  const { cloneElement } = require('react');
  return cloneElement(children, { onClick: handleClick });
}
