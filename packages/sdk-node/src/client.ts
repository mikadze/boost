import type {
  GamifyConfig,
  TrackEvent,
  PurchaseEvent,
  UserTraits,
  ReferralEvent,
  ApiResponse,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.gamify.io';
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;

/**
 * Gamify Node.js SDK Client
 *
 * Use this client for server-side event tracking with your secret API key.
 * This client can send all event types including financial events like purchases.
 *
 * @example
 * ```typescript
 * import { GamifyClient } from '@gamify/node';
 *
 * const client = new GamifyClient({
 *   secretKey: 'sk_live_your_key_here',
 * });
 *
 * // Track a purchase
 * await client.purchase({
 *   userId: 'user_123',
 *   orderId: 'order_456',
 *   amount: 9999, // $99.99 in cents
 *   currency: 'USD',
 * });
 * ```
 */
export class GamifyClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: GamifyConfig) {
    // Validate secret key format
    if (!config.secretKey) {
      throw new Error('GamifyClient requires a secretKey');
    }

    if (!config.secretKey.startsWith('sk_')) {
      throw new Error(
        'GamifyClient requires a secret key (sk_live_*). ' +
          'Publishable keys (pk_live_*) should only be used in client-side SDKs.'
      );
    }

    this.secretKey = config.secretKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.retries = config.retries || DEFAULT_RETRIES;
  }

  /**
   * Track a custom event
   *
   * @example
   * ```typescript
   * await client.track({
   *   userId: 'user_123',
   *   event: 'subscription_renewed',
   *   properties: {
   *     plan: 'premium',
   *     amount: 2999,
   *   },
   * });
   * ```
   */
  async track(event: TrackEvent): Promise<ApiResponse> {
    return this.request('/v1/events/track', {
      userId: event.userId,
      event: event.event,
      properties: event.properties || {},
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }

  /**
   * Track a purchase event
   *
   * This is a convenience method that sends a properly formatted purchase event.
   * Purchase events are used for affiliate commission calculations.
   *
   * @example
   * ```typescript
   * await client.purchase({
   *   userId: 'user_123',
   *   orderId: 'order_456',
   *   amount: 9999, // $99.99 in cents
   *   currency: 'USD',
   *   items: [
   *     { productId: 'prod_1', name: 'Widget', unitPrice: 4999, quantity: 2 },
   *   ],
   * });
   * ```
   */
  async purchase(data: PurchaseEvent): Promise<ApiResponse> {
    return this.track({
      userId: data.userId,
      event: 'purchase',
      properties: {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || 'USD',
        items: data.items,
      },
      timestamp: data.timestamp,
    });
  }

  /**
   * Identify a user with traits
   *
   * Updates user profile information for personalization and segmentation.
   *
   * @example
   * ```typescript
   * await client.identify('user_123', {
   *   email: 'john@example.com',
   *   name: 'John Doe',
   *   plan: 'premium',
   *   signupDate: '2024-01-15',
   * });
   * ```
   */
  async identify(userId: string, traits: UserTraits): Promise<ApiResponse> {
    return this.track({
      userId,
      event: '$profile_update',
      properties: traits,
    });
  }

  /**
   * Track a successful referral
   *
   * Call this when a referred user completes a qualifying action
   * (e.g., makes their first purchase, completes signup).
   *
   * @example
   * ```typescript
   * await client.referralSuccess({
   *   referredUserId: 'new_user_123',
   *   referralCode: 'FRIEND20',
   * });
   * ```
   */
  async referralSuccess(data: ReferralEvent): Promise<ApiResponse> {
    return this.track({
      userId: data.referredUserId,
      event: 'referral_success',
      properties: {
        referralCode: data.referralCode,
      },
      timestamp: data.timestamp,
    });
  }

  /**
   * Track checkout completion
   *
   * Alternative event name for purchase tracking.
   * Use either purchase() or checkoutComplete(), not both for the same transaction.
   */
  async checkoutComplete(data: PurchaseEvent): Promise<ApiResponse> {
    return this.track({
      userId: data.userId,
      event: 'checkout_complete',
      properties: {
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency || 'USD',
        items: data.items,
      },
      timestamp: data.timestamp,
    });
  }

  /**
   * Make an HTTP request to the Gamify API
   */
  private async request(
    path: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse> {
    const url = `${this.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.secretKey,
            'User-Agent': `gamify-node/0.1.0`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage: string;

          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorJson.error || errorBody;
          } catch {
            errorMessage = errorBody || `HTTP ${response.status}`;
          }

          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: errorMessage,
            };
          }

          throw new Error(errorMessage);
        }

        return { success: true };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on abort (timeout)
        if (lastError.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retries - 1) {
          await this.sleep(Math.pow(2, attempt) * 100);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed after retries',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
