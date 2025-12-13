/**
 * Event Classification for API Key Security
 *
 * Events are classified into two categories:
 * - TRUSTED: Can only be sent with secret keys (sk_live_*) from server-side
 * - UNTRUSTED: Can be sent with publishable keys (pk_live_*) from client-side
 *
 * Trusted events trigger financial actions (commissions, points, tier upgrades).
 * Untrusted events are for analytics and engagement tracking only.
 */

/**
 * Events that require a secret key (server-side only)
 * These events trigger financial/reward actions
 */
export const TRUSTED_EVENTS = [
  // Financial transactions
  'purchase',
  'checkout_complete',
  'checkout_success',
  // Commission system events (typically server-generated)
  'commission.created',
  'referral_success',
  // Progression/tier events (typically server-generated)
  'user.leveled_up',
  // Quest completion events (typically server-generated)
  'step.completed',
  'quest.completed',
] as const;

/**
 * Events that can be sent with publishable keys (client-side allowed)
 * These events are for analytics and cannot trigger financial actions
 */
export const UNTRUSTED_EVENTS = [
  // Behavioral/engagement events
  'page_view',
  'product_view',
  'click',
  'form_submit',
  'search',
  // Cart events (informational, actual purchase requires secret key)
  'cart_update',
  'cart_add',
  'cart_remove',
  'checkout_start',
  // User lifecycle (informational)
  'signup',
  'login',
  'logout',
  // Profile updates
  '$profile_update',
] as const;

export type TrustedEventType = (typeof TRUSTED_EVENTS)[number];
export type UntrustedEventType = (typeof UNTRUSTED_EVENTS)[number];

/**
 * Check if an event type requires a secret key (server-side only)
 */
export function isTrustedEvent(eventType: string): boolean {
  return (TRUSTED_EVENTS as readonly string[]).includes(eventType);
}

/**
 * Check if an event type is explicitly allowed from client-side
 */
export function isUntrustedEvent(eventType: string): boolean {
  return (UNTRUSTED_EVENTS as readonly string[]).includes(eventType);
}

/**
 * Check if an event type is allowed for a given API key type
 *
 * - Secret keys can send ALL events
 * - Publishable keys can only send untrusted events OR unknown events
 *   (unknown events are allowed but cannot trigger financial effects)
 */
export function isEventAllowedForKeyType(
  eventType: string,
  keyType: 'publishable' | 'secret',
): boolean {
  // Secret keys can send any event
  if (keyType === 'secret') {
    return true;
  }

  // Publishable keys cannot send trusted events
  if (isTrustedEvent(eventType)) {
    return false;
  }

  // Publishable keys can send untrusted or unknown events
  return true;
}

/**
 * Event source marker for downstream processing
 */
export type EventSource = 'server' | 'client';

/**
 * Get the event source based on key type
 */
export function getEventSource(keyType: 'publishable' | 'secret'): EventSource {
  return keyType === 'secret' ? 'server' : 'client';
}
