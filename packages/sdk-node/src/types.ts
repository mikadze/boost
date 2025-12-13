/**
 * Configuration options for the Gamify Node.js SDK
 */
export interface GamifyConfig {
  /**
   * Your secret API key (starts with sk_live_)
   * Get this from your Gamify dashboard
   */
  secretKey: string;

  /**
   * Base URL for the Gamify API
   * @default 'https://api.gamify.io'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests
   * @default 3
   */
  retries?: number;
}

/**
 * Base event properties that all events share
 */
export interface BaseEvent {
  /**
   * Unique identifier for the user
   */
  userId: string;

  /**
   * ISO 8601 timestamp of when the event occurred
   * If not provided, the current time will be used
   */
  timestamp?: string;
}

/**
 * Generic event for tracking custom events
 */
export interface TrackEvent extends BaseEvent {
  /**
   * Name of the event (e.g., 'purchase', 'signup', 'page_view')
   */
  event: string;

  /**
   * Additional properties for the event
   */
  properties?: Record<string, unknown>;
}

/**
 * Cart item in a purchase
 */
export interface PurchaseItem {
  /**
   * Unique identifier for the product
   */
  productId: string;

  /**
   * Name of the product
   */
  name: string;

  /**
   * Price per unit in cents
   */
  unitPrice: number;

  /**
   * Quantity purchased
   */
  quantity: number;

  /**
   * Optional product category
   */
  category?: string;
}

/**
 * Purchase event data
 */
export interface PurchaseEvent {
  /**
   * Unique identifier for the user making the purchase
   */
  userId: string;

  /**
   * Unique order identifier from your system
   */
  orderId: string;

  /**
   * Total amount in cents (e.g., 1999 for $19.99)
   */
  amount: number;

  /**
   * ISO 4217 currency code (e.g., 'USD', 'EUR')
   * @default 'USD'
   */
  currency?: string;

  /**
   * Items in the purchase
   */
  items?: PurchaseItem[];

  /**
   * ISO 8601 timestamp of when the purchase occurred
   */
  timestamp?: string;
}

/**
 * User traits for identification
 */
export interface UserTraits {
  /**
   * User's email address
   */
  email?: string;

  /**
   * User's display name
   */
  name?: string;

  /**
   * User's first name
   */
  firstName?: string;

  /**
   * User's last name
   */
  lastName?: string;

  /**
   * User's phone number
   */
  phone?: string;

  /**
   * ISO 8601 timestamp of when the user was created
   */
  createdAt?: string;

  /**
   * Any additional custom traits
   */
  [key: string]: unknown;
}

/**
 * Referral tracking data
 */
export interface ReferralEvent {
  /**
   * User ID of the person being referred (the new user)
   */
  referredUserId: string;

  /**
   * Referral code used
   */
  referralCode: string;

  /**
   * ISO 8601 timestamp of when the referral occurred
   */
  timestamp?: string;
}

/**
 * Response from API calls
 */
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
