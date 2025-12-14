/**
 * Rule types for AI-assisted automation wizard
 * These types match the backend DTOs in apps/api/src/campaigns/dto/create-rule.dto.ts
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
  | 'free_shipping'
  | 'custom';

export interface RuleCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

export interface RuleConditionGroup {
  logic: 'and' | 'or';
  conditions: RuleCondition[];
}

export interface RuleEffect {
  type: EffectType;
  params: Record<string, unknown>;
}

export interface GeneratedRule {
  name: string;
  description?: string;
  eventTypes: string[];
  conditions: RuleConditionGroup;
  effects: RuleEffect[];
}

export interface GenerateRuleRequest {
  prompt: string;
  context?: {
    campaignName?: string;
  };
}

export interface GenerateRuleResponse {
  rule: GeneratedRule;
  explanation?: string;
  confidence?: number;
}

// Standard event types for UI dropdowns
export const STANDARD_EVENT_TYPES = {
  // Cart events
  CART_UPDATE: 'cart_update',
  CART_ADD: 'cart_add',
  CART_REMOVE: 'cart_remove',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',
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

// Event type metadata for UI
export const EVENT_TYPE_INFO: Record<string, { label: string; icon: string; category: string }> = {
  purchase: { label: 'Purchase', icon: 'ShoppingBag', category: 'Commerce' },
  signup: { label: 'Sign Up', icon: 'UserPlus', category: 'Lifecycle' },
  login: { label: 'Login', icon: 'LogIn', category: 'Lifecycle' },
  logout: { label: 'Logout', icon: 'LogOut', category: 'Lifecycle' },
  page_view: { label: 'Page View', icon: 'Eye', category: 'Engagement' },
  product_view: { label: 'Product View', icon: 'Package', category: 'Commerce' },
  cart_update: { label: 'Cart Update', icon: 'ShoppingCart', category: 'Commerce' },
  cart_add: { label: 'Add to Cart', icon: 'Plus', category: 'Commerce' },
  cart_remove: { label: 'Remove from Cart', icon: 'Minus', category: 'Commerce' },
  checkout_start: { label: 'Checkout Started', icon: 'CreditCard', category: 'Commerce' },
  checkout_complete: { label: 'Checkout Complete', icon: 'CheckCircle', category: 'Commerce' },
  search: { label: 'Search', icon: 'Search', category: 'Engagement' },
  click: { label: 'Click', icon: 'MousePointer', category: 'Engagement' },
  form_submit: { label: 'Form Submit', icon: 'Send', category: 'Engagement' },
};

// Operator metadata for UI
export const OPERATOR_INFO: Record<ComparisonOperator, { label: string; types: ('string' | 'number' | 'boolean' | 'array')[] }> = {
  equals: { label: 'equals', types: ['string', 'number', 'boolean'] },
  not_equals: { label: 'does not equal', types: ['string', 'number', 'boolean'] },
  greater_than: { label: 'is greater than', types: ['number'] },
  greater_than_or_equal: { label: 'is at least', types: ['number'] },
  less_than: { label: 'is less than', types: ['number'] },
  less_than_or_equal: { label: 'is at most', types: ['number'] },
  contains: { label: 'contains', types: ['string'] },
  not_contains: { label: 'does not contain', types: ['string'] },
  starts_with: { label: 'starts with', types: ['string'] },
  ends_with: { label: 'ends with', types: ['string'] },
  in: { label: 'is one of', types: ['string', 'number'] },
  not_in: { label: 'is not one of', types: ['string', 'number'] },
  exists: { label: 'exists', types: ['string', 'number', 'boolean', 'array'] },
  not_exists: { label: 'does not exist', types: ['string', 'number', 'boolean', 'array'] },
};

// Effect type metadata for UI
export const EFFECT_TYPE_INFO: Record<string, { label: string; icon: string; params: { name: string; type: string; required: boolean }[] }> = {
  add_loyalty_points: {
    label: 'Add Loyalty Points',
    icon: 'Coins',
    params: [{ name: 'amount', type: 'number', required: true }],
  },
  apply_discount: {
    label: 'Apply Discount',
    icon: 'Percent',
    params: [
      { name: 'type', type: 'select:percentage,fixed', required: true },
      { name: 'value', type: 'number', required: true },
    ],
  },
  upgrade_tier: {
    label: 'Upgrade Tier',
    icon: 'TrendingUp',
    params: [{ name: 'tier', type: 'select:bronze,silver,gold,platinum', required: true }],
  },
  send_notification: {
    label: 'Send Notification',
    icon: 'Bell',
    params: [
      { name: 'title', type: 'string', required: true },
      { name: 'message', type: 'string', required: true },
    ],
  },
  free_shipping: {
    label: 'Free Shipping',
    icon: 'Truck',
    params: [],
  },
  add_item: {
    label: 'Add Bonus Item',
    icon: 'Gift',
    params: [
      { name: 'sku', type: 'string', required: true },
      { name: 'quantity', type: 'number', required: true },
    ],
  },
};

// Condition field metadata for UI
export const CONDITION_FIELDS: { field: string; label: string; type: 'string' | 'number' }[] = [
  { field: 'properties.total', label: 'Order Total (cents)', type: 'number' },
  { field: 'properties.subtotal', label: 'Subtotal (cents)', type: 'number' },
  { field: 'properties.items.length', label: 'Number of Items', type: 'number' },
  { field: 'user.tier', label: 'User Tier', type: 'string' },
  { field: 'user.purchaseCount', label: 'Purchase Count', type: 'number' },
  { field: 'user.loyaltyPoints', label: 'Loyalty Points', type: 'number' },
  { field: 'event.type', label: 'Event Type', type: 'string' },
];
