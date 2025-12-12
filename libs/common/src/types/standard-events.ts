/**
 * Standard Event Types for Gamification Platform
 * These interfaces enforce data consistency for rule evaluation
 */

// ============================================
// Cart Events
// ============================================

/**
 * Cart item structure for e-commerce events
 */
export interface CartItem {
  /** Product SKU or unique identifier */
  sku: string;
  /** Product name */
  name: string;
  /** Quantity of items */
  quantity: number;
  /** Unit price in cents (avoid floating point issues) */
  unitPrice: number;
  /** Product category (e.g., 'electronics', 'clothing') */
  category?: string;
  /** Product brand */
  brand?: string;
  /** Additional product metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cart update event payload
 */
export interface CartUpdatePayload {
  /** Cart items */
  items: CartItem[];
  /** Cart subtotal in cents */
  subtotal: number;
  /** Applied coupon codes */
  coupons?: string[];
  /** Currency code (ISO 4217) */
  currency?: string;
}

// ============================================
// Profile Events
// ============================================

/**
 * Profile update payload for user identification
 */
export interface ProfileUpdatePayload {
  /** User's email address */
  email?: string;
  /** User's display name */
  name?: string;
  /** User's phone number */
  phone?: string;
  /** User's date of birth (ISO 8601) */
  dateOfBirth?: string;
  /** User's preferred language */
  language?: string;
  /** User's timezone */
  timezone?: string;
  /** Additional user traits */
  traits?: Record<string, unknown>;
}

// ============================================
// Customer Events
// ============================================

/**
 * Purchase completed event payload
 */
export interface PurchasePayload {
  /** Order ID from merchant system */
  orderId: string;
  /** Purchased items */
  items: CartItem[];
  /** Total amount in cents */
  total: number;
  /** Discount amount in cents */
  discount?: number;
  /** Tax amount in cents */
  tax?: number;
  /** Shipping amount in cents */
  shipping?: number;
  /** Payment method used */
  paymentMethod?: string;
  /** Currency code (ISO 4217) */
  currency?: string;
}

/**
 * Signup event payload
 */
export interface SignupPayload {
  /** Signup method (email, social, etc.) */
  method: string;
  /** Referral code if applicable */
  referralCode?: string;
  /** Marketing campaign source */
  source?: string;
}

/**
 * Login event payload
 */
export interface LoginPayload {
  /** Login method (email, social, etc.) */
  method: string;
  /** Device type */
  deviceType?: string;
}

// ============================================
// Page/View Events
// ============================================

/**
 * Page view event payload
 */
export interface PageViewPayload {
  /** Page path/URL */
  path: string;
  /** Page title */
  title?: string;
  /** Referrer URL */
  referrer?: string;
}

/**
 * Product view event payload
 */
export interface ProductViewPayload {
  /** Product SKU */
  sku: string;
  /** Product name */
  name: string;
  /** Product price in cents */
  price: number;
  /** Product category */
  category?: string;
  /** Product brand */
  brand?: string;
}

// ============================================
// Standard Event Type Constants
// ============================================

export const STANDARD_EVENT_TYPES = {
  // Cart events
  CART_UPDATE: 'cart_update',
  CART_ADD: 'cart_add',
  CART_REMOVE: 'cart_remove',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',

  // Profile events
  PROFILE_UPDATE: '$profile_update',

  // Customer lifecycle
  SIGNUP: 'signup',
  LOGIN: 'login',
  LOGOUT: 'logout',
  PURCHASE: 'purchase',

  // Engagement events
  PAGE_VIEW: 'page_view',
  PRODUCT_VIEW: 'product_view',
  SEARCH: 'search',
  CLICK: 'click',
  FORM_SUBMIT: 'form_submit',
} as const;

export type StandardEventType = (typeof STANDARD_EVENT_TYPES)[keyof typeof STANDARD_EVENT_TYPES];

// ============================================
// Rule Engine Types
// ============================================

/**
 * Attribute types for rule conditions
 */
export type AttributeType = 'string' | 'number' | 'boolean' | 'date' | 'array';

/**
 * Comparison operators for rule conditions
 */
export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists';

/**
 * Rule condition structure (stored in JSONB)
 */
export interface RuleCondition {
  /** Field path using dot notation (e.g., 'properties.items.0.category') */
  field: string;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Value to compare against */
  value: unknown;
}

/**
 * Rule condition group with logical operator
 */
export interface RuleConditionGroup {
  /** Logical operator for combining conditions */
  logic: 'and' | 'or';
  /** Individual conditions */
  conditions: RuleCondition[];
}

/**
 * Effect types that can be triggered by rules
 */
export type EffectType =
  | 'apply_discount'
  | 'add_item'
  | 'remove_item'
  | 'set_shipping'
  | 'apply_coupon'
  | 'reject_coupon'
  | 'add_loyalty_points'
  | 'upgrade_tier'
  | 'send_notification'
  | 'custom';

/**
 * Rule effect structure (stored in JSONB)
 */
export interface RuleEffect {
  /** Type of effect to apply */
  type: EffectType;
  /** Effect-specific parameters */
  params: Record<string, unknown>;
}

/**
 * Campaign schedule structure
 */
export interface CampaignSchedule {
  /** Start date (ISO 8601) */
  startDate?: string;
  /** End date (ISO 8601) */
  endDate?: string;
  /** Days of week active (0-6, Sunday = 0) */
  daysOfWeek?: number[];
  /** Start time (HH:mm) */
  startTime?: string;
  /** End time (HH:mm) */
  endTime?: string;
  /** Timezone for schedule */
  timezone?: string;
}

/**
 * Evaluated rule result
 */
export interface EvaluatedRuleResult {
  /** Rule ID that matched */
  ruleId: string;
  /** Campaign ID */
  campaignId: string;
  /** Effects to apply */
  effects: RuleEffect[];
  /** Priority of the rule */
  priority: number;
}
