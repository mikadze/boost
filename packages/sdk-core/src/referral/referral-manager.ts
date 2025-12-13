import type { GamifyConfig, StorageAdapter } from '../types.js';

const REFERRER_KEY = '__gamify_referrer';
const REFERRER_DETECTED_AT_KEY = '__gamify_referrer_detected_at';

/**
 * Referral Manager - Handles URL parameter detection and referrer storage
 *
 * Automatically detects `?ref=code` parameter from URLs and stores
 * the referrer code in localStorage for attribution tracking.
 */
export class ReferralManager {
  private readonly config: Required<GamifyConfig>;
  private readonly storage: StorageAdapter;
  private referrerCode: string | null = null;

  constructor(
    config: Required<GamifyConfig>,
    storage: StorageAdapter
  ) {
    this.config = config;
    this.storage = storage;

    // Load stored referrer
    this.referrerCode = this.storage.get<string>(REFERRER_KEY);

    // Auto-detect referrer from URL on initialization
    this.detectReferrerFromUrl();
  }

  /**
   * Log debug messages
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[Gamify:Referral] ${message}`, data ?? '');
    }
  }

  /**
   * Detect referrer code from current URL
   * Looks for `?ref=` parameter
   */
  detectReferrerFromUrl(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');

      if (refCode && refCode.length > 0) {
        this.log('Detected referrer from URL', { refCode });
        this.setReferrer(refCode);
        return refCode;
      }
    } catch (error) {
      this.log('Error detecting referrer from URL', error);
    }

    return null;
  }

  /**
   * Manually set the referrer code
   */
  setReferrer(code: string): void {
    if (!code || code.length === 0) {
      this.log('Invalid referrer code provided');
      return;
    }

    this.referrerCode = code;
    this.storage.set(REFERRER_KEY, code);
    this.storage.set(REFERRER_DETECTED_AT_KEY, new Date().toISOString());

    this.log('Referrer code stored', { code });
  }

  /**
   * Get the current referrer code
   */
  getReferrer(): string | null {
    return this.referrerCode;
  }

  /**
   * Check if a referrer code is present
   */
  hasReferrer(): boolean {
    return this.referrerCode !== null;
  }

  /**
   * Clear the referrer code
   */
  clearReferrer(): void {
    this.referrerCode = null;
    this.storage.remove(REFERRER_KEY);
    this.storage.remove(REFERRER_DETECTED_AT_KEY);
    this.log('Referrer code cleared');
  }

  /**
   * Get referrer data to include in event properties
   */
  getReferrerProperties(): Record<string, unknown> {
    if (!this.referrerCode) {
      return {};
    }

    return {
      referrer: this.referrerCode,
      referrer_detected_at: this.storage.get<string>(REFERRER_DETECTED_AT_KEY),
    };
  }
}
