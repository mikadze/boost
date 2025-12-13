import type { GamifyConfig, GamifyEvent, UserTraits, StorageAdapter, CartItem, AffiliateStats, LeaderboardResponse } from './types.js';
import { createStorage } from './storage/index.js';
import { EventQueue } from './queue/index.js';
import { HttpClient } from './network/index.js';
import { SessionManager } from './session/index.js';
import { LoyaltyManager } from './loyalty/index.js';
import { ReferralManager } from './referral/index.js';
import { AffiliateManager } from './affiliate/index.js';

const DEFAULT_ENDPOINT = 'https://api.gamify.io';
const DEFAULT_FLUSH_INTERVAL = 10000; // 10 seconds
const DEFAULT_MAX_BATCH_SIZE = 10;
const DEFAULT_STORAGE_PREFIX = 'gamify_';
const USER_ID_KEY = 'user_id';
const ANONYMOUS_ID_KEY = 'anonymous_id';
const USER_TRAITS_KEY = 'user_traits';

/**
 * Generate anonymous ID for unidentified users
 */
function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Gamify SDK - Framework-agnostic event tracking
 */
export class Gamify {
  private readonly config: Required<GamifyConfig>;
  private readonly storage: StorageAdapter;
  private readonly queue: EventQueue;
  private readonly client: HttpClient;
  private readonly _session: SessionManager;
  private readonly _loyalty: LoyaltyManager;
  private readonly _referral: ReferralManager;
  private readonly _affiliate: AffiliateManager;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private anonymousId: string;
  private userId: string | null = null;
  private userTraits: UserTraits | null = null;
  private initialized = false;

  constructor(config: GamifyConfig) {
    if (!config.apiKey) {
      throw new Error('[Gamify] API key is required');
    }

    this.config = {
      apiKey: config.apiKey,
      endpoint: config.endpoint ?? DEFAULT_ENDPOINT,
      debug: config.debug ?? false,
      flushInterval: config.flushInterval ?? DEFAULT_FLUSH_INTERVAL,
      maxBatchSize: config.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE,
      storagePrefix: config.storagePrefix ?? DEFAULT_STORAGE_PREFIX,
    };

    this.storage = createStorage(this.config.storagePrefix);
    this.queue = new EventQueue(this.storage);
    this.client = new HttpClient(
      this.config.endpoint,
      this.config.apiKey,
      this.config.debug
    );

    // Initialize Session and Loyalty managers
    this._session = new SessionManager(this.config, this.client, this.storage);
    this._loyalty = new LoyaltyManager(this.config, this.client, this.storage);

    // Issue #22: Initialize Referral and Affiliate managers
    this._referral = new ReferralManager(this.config, this.storage);
    this._affiliate = new AffiliateManager(this.config, this.client, this.storage);

    // Load or generate anonymous ID
    const storedAnonymousId = this.storage.get<string>(ANONYMOUS_ID_KEY);
    this.anonymousId = storedAnonymousId ?? generateAnonymousId();
    if (!storedAnonymousId) {
      this.storage.set(ANONYMOUS_ID_KEY, this.anonymousId);
    }

    // Load persisted user identity
    this.userId = this.storage.get<string>(USER_ID_KEY);
    this.userTraits = this.storage.get<UserTraits>(USER_TRAITS_KEY);

    this.initialize();
  }

  /**
   * Initialize the SDK
   */
  private initialize(): void {
    if (this.initialized) return;

    this.log('Initializing SDK');

    // Start flush timer
    this.startFlushTimer();

    // Handle page unload - flush remaining events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.onBeforeUnload());
      window.addEventListener('pagehide', () => this.onBeforeUnload());
    }

    this.initialized = true;
    this.log('SDK initialized', {
      anonymousId: this.anonymousId,
      userId: this.userId,
    });
  }

  /**
   * Log debug messages
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[Gamify] ${message}`, data ?? '');
    }
  }

  /**
   * Start the automatic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      void this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Handle page unload - send remaining events via beacon
   */
  private onBeforeUnload(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    const pending = this.queue.peek(this.config.maxBatchSize);
    if (pending.length > 0) {
      const events = pending.map((item) => item.event);
      this.client.sendBeacon(events);
    }
  }

  /**
   * Identify a user with optional traits
   * User ID persists across page reloads
   */
  identify(userId: string, traits?: UserTraits): void {
    if (!userId || typeof userId !== 'string') {
      this.log('Invalid user ID provided');
      return;
    }

    this.log('Identifying user', { userId, traits });

    this.userId = userId;
    this.storage.set(USER_ID_KEY, userId);

    if (traits) {
      this.userTraits = { ...this.userTraits, ...traits };
      this.storage.set(USER_TRAITS_KEY, this.userTraits);
    }

    // Track identify event
    this.track('$identify', {
      userId,
      traits: traits ?? {},
    });
  }

  /**
   * Track an event
   */
  track(eventType: string, properties?: Record<string, unknown>): void {
    if (!eventType || typeof eventType !== 'string') {
      this.log('Invalid event type provided');
      return;
    }

    // Issue #22: Inject referrer properties into event
    const referrerProps = this._referral.getReferrerProperties();

    const event: GamifyEvent = {
      type: eventType,
      properties: { ...referrerProps, ...properties },
      timestamp: new Date().toISOString(),
      anonymousId: this.anonymousId,
      ...(this.userId && { userId: this.userId }),
    };

    this.log('Tracking event', event);

    this.queue.enqueue(event);

    // Auto-flush if batch size reached
    if (this.queue.size() >= this.config.maxBatchSize) {
      void this.flush();
    }
  }

  /**
   * Flush pending events to the server
   */
  async flush(): Promise<void> {
    const pending = this.queue.peek(this.config.maxBatchSize);
    if (pending.length === 0) {
      return;
    }

    const events = pending.map((item) => item.event);
    const ids = pending.map((item) => item.id);

    this.log(`Flushing ${events.length} events`);

    const result = await this.client.sendEvents(events);

    if (result.success) {
      this.queue.acknowledge(ids);
    } else {
      this.queue.nack(ids);
    }
  }

  /**
   * Reset the SDK state (logout user)
   */
  reset(): void {
    this.log('Resetting SDK state');

    this.userId = null;
    this.userTraits = null;
    this.storage.remove(USER_ID_KEY);
    this.storage.remove(USER_TRAITS_KEY);

    // Generate new anonymous ID
    this.anonymousId = generateAnonymousId();
    this.storage.set(ANONYMOUS_ID_KEY, this.anonymousId);
  }

  /**
   * Get current user ID (null if not identified)
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Get anonymous ID
   */
  getAnonymousId(): string {
    return this.anonymousId;
  }

  /**
   * Get pending event count
   */
  getPendingCount(): number {
    return this.queue.size();
  }

  /**
   * Shutdown the SDK gracefully
   */
  shutdown(): void {
    this.log('Shutting down SDK');

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Attempt final flush via beacon
    const pending = this.queue.peek(this.config.maxBatchSize);
    if (pending.length > 0) {
      const events = pending.map((item) => item.event);
      this.client.sendBeacon(events);
    }
  }

  // ============================================
  // Session Module (Issue #14)
  // ============================================

  /**
   * Get the session manager
   */
  get session(): SessionManager {
    return this._session;
  }

  /**
   * Convenience method: Update cart and get discounts
   */
  async updateCart(
    items: CartItem[],
    coupons?: string[],
    currency?: string,
  ) {
    if (!this.userId) {
      throw new Error('[Gamify] User must be identified before updating cart');
    }
    return this._session.updateCart(this.userId, items, coupons, currency);
  }

  // ============================================
  // Loyalty Module (Issue #15)
  // ============================================

  /**
   * Get the loyalty manager
   */
  get loyalty(): LoyaltyManager {
    return this._loyalty;
  }

  /**
   * Convenience method: Get loyalty profile for current user
   */
  async getLoyaltyProfile() {
    if (!this.userId) {
      throw new Error('[Gamify] User must be identified before getting loyalty profile');
    }
    return this._loyalty.getProfile(this.userId);
  }

  /**
   * Convenience method: Get loyalty history for current user
   */
  async getLoyaltyHistory(limit?: number, offset?: number) {
    if (!this.userId) {
      throw new Error('[Gamify] User must be identified before getting loyalty history');
    }
    return this._loyalty.getHistory(this.userId, limit, offset);
  }

  // ============================================
  // Referral Module (Issue #22)
  // ============================================

  /**
   * Get the referral manager
   */
  get referral(): ReferralManager {
    return this._referral;
  }

  /**
   * Convenience method: Get current referrer code
   */
  getReferrer(): string | null {
    return this._referral.getReferrer();
  }

  /**
   * Convenience method: Set referrer code manually
   */
  setReferrer(code: string): void {
    this._referral.setReferrer(code);
  }

  // ============================================
  // Affiliate Module (Issue #22)
  // ============================================

  /**
   * Get the affiliate manager
   */
  get affiliate(): AffiliateManager {
    return this._affiliate;
  }

  /**
   * Convenience method: Get affiliate stats for current user
   */
  async getAffiliateStats(forceRefresh = false): Promise<AffiliateStats> {
    if (!this.userId) {
      throw new Error('[Gamify] User must be identified before getting affiliate stats');
    }
    return this._affiliate.getStats(this.userId, forceRefresh);
  }

  /**
   * Convenience method: Get leaderboard
   */
  async getLeaderboard(limit = 10): Promise<LeaderboardResponse> {
    return this._affiliate.getLeaderboard(limit);
  }
}
