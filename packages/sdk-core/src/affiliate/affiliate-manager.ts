import type {
  GamifyConfig,
  StorageAdapter,
  AffiliateStats,
  LeaderboardResponse,
} from '../types.js';
import type { HttpClient } from '../network/index.js';

const AFFILIATE_STATS_CACHE_KEY = 'affiliate_stats';
const CACHE_TTL_MS = 60000; // 1 minute

/**
 * Affiliate Manager - Handles fetching affiliate stats and leaderboard
 */
export class AffiliateManager {
  private readonly config: Required<GamifyConfig>;
  private readonly client: HttpClient;
  private readonly storage: StorageAdapter;
  private cachedStats: AffiliateStats | null = null;
  private lastFetchTime: number = 0;

  constructor(
    config: Required<GamifyConfig>,
    client: HttpClient,
    storage: StorageAdapter
  ) {
    this.config = config;
    this.client = client;
    this.storage = storage;

    // Load cached stats
    const cached = this.storage.get<{ stats: AffiliateStats; fetchedAt: number }>(
      AFFILIATE_STATS_CACHE_KEY
    );
    if (cached) {
      this.cachedStats = cached.stats;
      this.lastFetchTime = cached.fetchedAt;
    }
  }

  /**
   * Log debug messages
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[Gamify:Affiliate] ${message}`, data ?? '');
    }
  }

  /**
   * Get affiliate stats for the current user
   * @param userId - User ID to fetch stats for
   * @param forceRefresh - Force refresh from API
   */
  async getStats(userId: string, forceRefresh = false): Promise<AffiliateStats> {
    // Check cache validity
    const now = Date.now();
    const cacheValid = !forceRefresh && this.cachedStats && now - this.lastFetchTime < CACHE_TTL_MS;

    if (cacheValid && this.cachedStats) {
      this.log('Returning cached affiliate stats');
      return this.cachedStats;
    }

    this.log('Fetching affiliate stats from API', { userId });

    try {
      const response = await this.client.get<AffiliateStats>(
        `/v1/customer/affiliate/profile?userId=${encodeURIComponent(userId)}`
      );

      if (response.success && response.data) {
        // Map API response to AffiliateStats shape
        const stats: AffiliateStats = {
          referralCode: response.data.referralCode,
          referralCount: response.data.stats?.referralCount ?? 0,
          earnings: {
            totalEarned: response.data.stats?.totalEarned ?? 0,
            totalPending: response.data.stats?.totalPending ?? 0,
            totalPaid: response.data.stats?.totalPaid ?? 0,
          },
        };

        this.cachedStats = stats;
        this.lastFetchTime = now;

        // Persist to storage
        this.storage.set(AFFILIATE_STATS_CACHE_KEY, {
          stats,
          fetchedAt: now,
        });

        this.log('Affiliate stats fetched', stats);
        return stats;
      }

      throw new Error(response.error ?? 'Invalid response from affiliate stats API');
    } catch (error) {
      this.log('Error fetching affiliate stats', error);
      throw error;
    }
  }

  /**
   * Get cached affiliate stats (if available)
   */
  getCachedStats(): AffiliateStats | null {
    return this.cachedStats;
  }

  /**
   * Get leaderboard data
   * @param limit - Number of entries to fetch (default: 10)
   */
  async getLeaderboard(limit = 10): Promise<LeaderboardResponse> {
    this.log('Fetching leaderboard', { limit });

    try {
      const response = await this.client.get<LeaderboardResponse>(
        `/v1/customer/affiliate/leaderboard?limit=${limit}`
      );

      if (response.success && response.data?.entries) {
        this.log('Leaderboard fetched', { count: response.data.entries.length });
        return response.data;
      }

      throw new Error(response.error ?? 'Invalid response from leaderboard API');
    } catch (error) {
      this.log('Error fetching leaderboard', error);
      throw error;
    }
  }

  /**
   * Clear cached affiliate stats
   */
  clearCache(): void {
    this.cachedStats = null;
    this.lastFetchTime = 0;
    this.storage.remove(AFFILIATE_STATS_CACHE_KEY);
    this.log('Affiliate stats cache cleared');
  }
}
