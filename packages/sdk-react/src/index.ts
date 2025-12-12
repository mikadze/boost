/**
 * @gamify/react - React SDK for Gamify event tracking
 * @packageDocumentation
 */

// Context and Provider
export { GamifyProvider, type GamifyProviderProps, type GamifyContextValue } from './context.js';

// Hooks
export { useGamify, useTrack, useIdentify } from './hooks.js';

// Components
export { GamifyPageView, GamifyTrackClick, type GamifyPageViewProps, type GamifyTrackClickProps } from './components.js';

// Re-export core types for convenience
export type { GamifyConfig, GamifyEvent, UserTraits } from '@gamify/core';
