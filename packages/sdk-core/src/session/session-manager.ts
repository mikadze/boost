import type {
  GamifyConfig,
  SessionRequest,
  SessionResponse,
  CartItem,
  StorageAdapter,
} from '../types.js';
import { HttpClient } from '../network/index.js';

const SESSION_TOKEN_KEY = 'session_token';
const SESSION_DATA_KEY = 'session_data';

/**
 * SessionManager - Manages cart sessions with discount calculations
 */
export class SessionManager {
  private readonly client: HttpClient;
  private readonly storage: StorageAdapter;
  private readonly debug: boolean;
  private sessionToken: string | null = null;
  private cachedSession: SessionResponse | null = null;

  constructor(
    config: Required<GamifyConfig>,
    client: HttpClient,
    storage: StorageAdapter,
  ) {
    this.client = client;
    this.storage = storage;
    this.debug = config.debug;

    // Load persisted session token
    this.sessionToken = this.storage.get<string>(SESSION_TOKEN_KEY);
    this.cachedSession = this.storage.get<SessionResponse>(SESSION_DATA_KEY);
  }

  /**
   * Create or update a session with cart items
   */
  async updateCart(
    userId: string,
    items: CartItem[],
    coupons?: string[],
    currency?: string,
  ): Promise<SessionResponse> {
    const request: SessionRequest = {
      userId,
      items,
      coupons,
      currency,
    };

    this.log('Updating cart', request);

    const response = await this.client.post<SessionResponse>(
      '/v1/sessions',
      request,
    );

    if (response.success && response.data) {
      this.sessionToken = response.data.sessionToken;
      this.cachedSession = response.data;
      this.storage.set(SESSION_TOKEN_KEY, this.sessionToken);
      this.storage.set(SESSION_DATA_KEY, this.cachedSession);

      this.log('Cart updated', response.data);
      return response.data;
    }

    throw new Error(response.error || 'Failed to update cart');
  }

  /**
   * Get current session by token
   */
  async getSession(): Promise<SessionResponse | null> {
    if (!this.sessionToken) {
      return null;
    }

    this.log('Getting session', this.sessionToken);

    const response = await this.client.get<SessionResponse>(
      `/v1/sessions/${this.sessionToken}`,
    );

    if (response.success && response.data) {
      this.cachedSession = response.data;
      this.storage.set(SESSION_DATA_KEY, this.cachedSession);
      return response.data;
    }

    // Session not found, clear local state
    if (response.error?.includes('not found')) {
      this.clearSession();
    }

    return null;
  }

  /**
   * Apply a coupon to the current session
   */
  async applyCoupon(code: string): Promise<SessionResponse> {
    if (!this.sessionToken) {
      throw new Error('No active session');
    }

    this.log('Applying coupon', code);

    const response = await this.client.post<SessionResponse>(
      `/v1/sessions/${this.sessionToken}/coupons`,
      { code },
    );

    if (response.success && response.data) {
      this.cachedSession = response.data;
      this.storage.set(SESSION_DATA_KEY, this.cachedSession);

      this.log('Coupon applied', response.data);
      return response.data;
    }

    throw new Error(response.error || 'Failed to apply coupon');
  }

  /**
   * Complete the session (checkout)
   */
  async complete(): Promise<SessionResponse> {
    if (!this.sessionToken) {
      throw new Error('No active session');
    }

    this.log('Completing session');

    const response = await this.client.post<SessionResponse>(
      `/v1/sessions/${this.sessionToken}/complete`,
      {},
    );

    if (response.success && response.data) {
      this.cachedSession = response.data;
      this.storage.set(SESSION_DATA_KEY, this.cachedSession);

      this.log('Session completed', response.data);
      return response.data;
    }

    throw new Error(response.error || 'Failed to complete session');
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.sessionToken = null;
    this.cachedSession = null;
    this.storage.remove(SESSION_TOKEN_KEY);
    this.storage.remove(SESSION_DATA_KEY);

    this.log('Session cleared');
  }

  /**
   * Get cached session data
   */
  getCachedSession(): SessionResponse | null {
    return this.cachedSession;
  }

  /**
   * Get current session token
   */
  getSessionToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Check if there's an active session
   */
  hasActiveSession(): boolean {
    return (
      this.sessionToken !== null &&
      this.cachedSession?.status === 'active'
    );
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[Gamify:Session] ${message}`, data ?? '');
    }
  }
}
