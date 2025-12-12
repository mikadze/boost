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
} from './types.js';

// Re-export internals for advanced usage
export { createStorage } from './storage/index.js';
export { EventQueue } from './queue/index.js';
export { HttpClient } from './network/index.js';
