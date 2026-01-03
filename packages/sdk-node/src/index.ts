/**
 * Gamify Node.js SDK
 *
 * Server-side SDK for tracking events with your secret API key.
 * Use this for backend integrations where you need to track
 * financial events like purchases and referral completions.
 *
 * @example
 * ```typescript
 * import { GamifyClient } from '@gamifyio/node';
 *
 * const gamify = new GamifyClient({
 *   secretKey: process.env.GAMIFY_SECRET_KEY!,
 * });
 *
 * // Track a purchase after payment confirmation
 * await gamify.purchase({
 *   userId: customer.id,
 *   orderId: order.id,
 *   amount: order.totalCents,
 *   currency: 'USD',
 * });
 *
 * // Identify a user
 * await gamify.identify(customer.id, {
 *   email: customer.email,
 *   name: customer.name,
 * });
 * ```
 *
 * @packageDocumentation
 */

export { GamifyClient } from './client.js';
export type {
  GamifyConfig,
  TrackEvent,
  PurchaseEvent,
  PurchaseItem,
  UserTraits,
  ReferralEvent,
  ApiResponse,
} from './types.js';
