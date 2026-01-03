'use client';

import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Gamify, type GamifyConfig, type Theme, defaultTheme } from '@gamifyio/core';

/**
 * Context value for Gamify React SDK
 */
export interface GamifyContextValue {
  /** The underlying Gamify client instance */
  client: Gamify;
  /** Track an event */
  track: (eventType: string, properties?: Record<string, unknown>) => void;
  /** Identify a user */
  identify: (userId: string, traits?: Record<string, unknown>) => void;
  /** Reset user identity */
  reset: () => void;
  /** Get current user ID */
  getUserId: () => string | null;
  /** Get anonymous ID */
  getAnonymousId: () => string;
}

const GamifyContext = createContext<GamifyContextValue | null>(null);

/**
 * Theme context for SDK components
 */
const ThemeContext = createContext<Theme>(defaultTheme);

/**
 * Props for GamifyProvider
 */
export interface GamifyProviderProps {
  /** Gamify SDK configuration */
  config: GamifyConfig;
  /** Optional theme override (Partial<Theme>) */
  theme?: Partial<Theme>;
  /** Child components */
  children: ReactNode;
}

/**
 * Check if code is running on the server
 */
function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * GamifyProvider - Initializes and provides Gamify SDK to React components
 *
 * @example
 * ```tsx
 * <GamifyProvider config={{ apiKey: 'your-api-key' }}>
 *   <App />
 * </GamifyProvider>
 *
 * // With custom theme
 * <GamifyProvider
 *   config={{ apiKey: 'your-api-key' }}
 *   theme={{ primary: '#00FF00' }}
 * >
 *   <App />
 * </GamifyProvider>
 * ```
 */
export function GamifyProvider({ config, theme, children }: GamifyProviderProps) {
  const clientRef = useRef<Gamify | null>(null);

  // Merge user theme with defaults
  const mergedTheme = useMemo<Theme>(() => {
    if (!theme) return defaultTheme;
    return { ...defaultTheme, ...theme };
  }, [theme]);

  // Initialize client only once and only on client-side
  const client = useMemo(() => {
    // SSR safety: return null on server
    if (isServer()) {
      return null;
    }

    // Reuse existing client if config hasn't changed
    if (clientRef.current) {
      return clientRef.current;
    }

    const newClient = new Gamify(config);
    clientRef.current = newClient;
    return newClient;
  }, [config.apiKey, config.endpoint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.shutdown();
        clientRef.current = null;
      }
    };
  }, []);

  // Create context value with wrapper methods
  const contextValue = useMemo<GamifyContextValue | null>(() => {
    if (!client) return null;

    return {
      client,
      track: (eventType, properties) => client.track(eventType, properties),
      identify: (userId, traits) => client.identify(userId, traits),
      reset: () => client.reset(),
      getUserId: () => client.getUserId(),
      getAnonymousId: () => client.getAnonymousId(),
    };
  }, [client]);

  // During SSR, render children without context but with theme
  if (!contextValue) {
    return (
      <ThemeContext.Provider value={mergedTheme}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={mergedTheme}>
      <GamifyContext.Provider value={contextValue}>
        {children}
      </GamifyContext.Provider>
    </ThemeContext.Provider>
  );
}

/**
 * useGamifyContext - Internal hook to access Gamify context
 */
export function useGamifyContext(): GamifyContextValue | null {
  return useContext(GamifyContext);
}

/**
 * useGamifyTheme - Hook to access the current theme
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useGamifyTheme();
 *   return <div style={{ color: theme.foreground }}>Themed content</div>;
 * }
 * ```
 */
export function useGamifyTheme(): Theme {
  return useContext(ThemeContext);
}
