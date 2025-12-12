/**
 * Configuration options for the Gamify SDK
 */
export interface GamifyConfig {
  /** API key for authentication */
  apiKey: string;
  /** Base URL for the API endpoint */
  endpoint?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Flush interval in milliseconds (default: 10000) */
  flushInterval?: number;
  /** Maximum events to batch before auto-flush (default: 10) */
  maxBatchSize?: number;
  /** Storage key prefix (default: 'gamify_') */
  storagePrefix?: string;
}

/**
 * Event payload structure
 */
export interface GamifyEvent {
  /** Event type (e.g., 'page_view', 'click', 'purchase') */
  type: string;
  /** Event properties */
  properties?: Record<string, unknown>;
  /** Timestamp when event occurred */
  timestamp: string;
  /** User ID if identified */
  userId?: string;
  /** Anonymous ID for unidentified users */
  anonymousId: string;
}

/**
 * User traits for identify calls
 */
export interface UserTraits {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Internal queued event with metadata
 */
export interface QueuedEvent {
  id: string;
  event: GamifyEvent;
  attempts: number;
  createdAt: number;
}

/**
 * API response structure
 */
export interface ApiResponse {
  success: boolean;
  error?: string;
}

/**
 * Storage interface for persistence layer
 */
export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

// ============================================
// Issue #14: Session Types
// ============================================

/**
 * Cart item structure for sessions
 */
export interface CartItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  brand?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session request to create/update cart
 */
export interface SessionRequest {
  userId: string;
  items: CartItem[];
  coupons?: string[];
  currency?: string;
}

/**
 * Applied effect from rule engine
 */
export interface AppliedEffect {
  type: string;
  ruleId?: string;
  params: Record<string, unknown>;
  discountAmount?: number;
}

/**
 * Session response from API
 */
export interface SessionResponse {
  sessionToken: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  coupons: string[];
  appliedEffects: AppliedEffect[];
  rejectedCoupons?: string[];
  currency: string;
  status: string;
}

// ============================================
// Issue #15: Loyalty Types
// ============================================

/**
 * Loyalty tier information
 */
export interface LoyaltyTier {
  id: string;
  name: string;
  level: number;
  benefits: Record<string, unknown>;
  color?: string | null;
  iconUrl?: string | null;
}

/**
 * Next tier information
 */
export interface NextTierInfo {
  id: string;
  name: string;
  minPoints: number;
  pointsNeeded: number;
}

/**
 * Loyalty summary statistics
 */
export interface LoyaltySummary {
  totalEarned: number;
  totalRedeemed: number;
  transactionCount: number;
}

/**
 * Customer loyalty profile
 */
export interface LoyaltyProfile {
  userId: string;
  points: number;
  tier: LoyaltyTier | null;
  nextTier: NextTierInfo | null;
  summary: LoyaltySummary;
}

/**
 * Loyalty transaction entry
 */
export interface LoyaltyTransaction {
  id: string;
  amount: number;
  balance: number;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
}

/**
 * Loyalty history response
 */
export interface LoyaltyHistoryResponse {
  transactions: LoyaltyTransaction[];
  total: number;
}
