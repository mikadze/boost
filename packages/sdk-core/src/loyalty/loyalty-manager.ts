import type {
  GamifyConfig,
  LoyaltyProfile,
  LoyaltyHistoryResponse,
  StorageAdapter,
} from '../types.js';
import { HttpClient } from '../network/index.js';

const LOYALTY_PROFILE_KEY = 'loyalty_profile';

/**
 * LoyaltyManager - Manages customer loyalty points and tiers
 */
export class LoyaltyManager {
  private readonly client: HttpClient;
  private readonly storage: StorageAdapter;
  private readonly debug: boolean;
  private cachedProfile: LoyaltyProfile | null = null;

  constructor(
    config: Required<GamifyConfig>,
    client: HttpClient,
    storage: StorageAdapter,
  ) {
    this.client = client;
    this.storage = storage;
    this.debug = config.debug;

    // Load cached profile
    this.cachedProfile = this.storage.get<LoyaltyProfile>(LOYALTY_PROFILE_KEY);
  }

  /**
   * Get customer loyalty profile
   */
  async getProfile(userId: string): Promise<LoyaltyProfile> {
    this.log('Getting loyalty profile', userId);

    const response = await this.client.get<LoyaltyProfile>(
      `/v1/customer/profile?userId=${encodeURIComponent(userId)}`,
    );

    if (response.success && response.data) {
      this.cachedProfile = response.data;
      this.storage.set(LOYALTY_PROFILE_KEY, this.cachedProfile);

      this.log('Profile loaded', response.data);
      return response.data;
    }

    throw new Error(response.error || 'Failed to get loyalty profile');
  }

  /**
   * Get customer transaction history
   */
  async getHistory(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<LoyaltyHistoryResponse> {
    this.log('Getting loyalty history', { userId, limit, offset });

    const params = new URLSearchParams();
    params.set('userId', userId);
    if (limit !== undefined) params.set('limit', String(limit));
    if (offset !== undefined) params.set('offset', String(offset));

    const response = await this.client.get<LoyaltyHistoryResponse>(
      `/v1/customer/history?${params.toString()}`,
    );

    if (response.success && response.data) {
      this.log('History loaded', response.data);
      return response.data;
    }

    throw new Error(response.error || 'Failed to get loyalty history');
  }

  /**
   * Get cached loyalty profile
   */
  getCachedProfile(): LoyaltyProfile | null {
    return this.cachedProfile;
  }

  /**
   * Get current points balance from cache
   */
  getPoints(): number {
    return this.cachedProfile?.points ?? 0;
  }

  /**
   * Get current tier from cache
   */
  getTier(): LoyaltyProfile['tier'] {
    return this.cachedProfile?.tier ?? null;
  }

  /**
   * Get next tier info from cache
   */
  getNextTier(): LoyaltyProfile['nextTier'] {
    return this.cachedProfile?.nextTier ?? null;
  }

  /**
   * Clear cached profile
   */
  clearCache(): void {
    this.cachedProfile = null;
    this.storage.remove(LOYALTY_PROFILE_KEY);
    this.log('Cache cleared');
  }

  /**
   * Refresh profile from server
   */
  async refresh(userId: string): Promise<LoyaltyProfile> {
    return this.getProfile(userId);
  }

  private log(message: string, data?: unknown): void {
    if (this.debug) {
      console.log(`[Gamify:Loyalty] ${message}`, data ?? '');
    }
  }
}
