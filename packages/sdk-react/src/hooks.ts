'use client';

import { useCallback } from 'react';
import { useGamifyContext, type GamifyContextValue } from './context.js';

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
