import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  foreignKey,
  index,
  jsonb,
  boolean,
  integer,
  bigint,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Multi-Tenant Schema for Boost
 * Uses logical isolation via app.current_project_id RLS context
 */

// Organizations table - top-level tenant
export const organizations = pgTable('organization', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  logo: text('logo'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Better-Auth Tables (Human Authentication)
// ============================================

// Users table - human users for dashboard access
export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table - active user sessions
export const sessions = pgTable('session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userFk: foreignKey({
    columns: [t.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  tokenIdx: uniqueIndex('session_token_idx').on(t.token),
  userIdx: index('session_user_idx').on(t.userId),
}));

// Accounts table - OAuth/credential providers linked to users
export const accounts = pgTable('account', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userFk: foreignKey({
    columns: [t.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  providerIdx: uniqueIndex('account_provider_idx').on(t.providerId, t.accountId),
  userIdx: index('account_user_idx').on(t.userId),
}));

// Verifications table - email verification, password reset tokens
export const verifications = pgTable('verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  identifierIdx: index('verification_identifier_idx').on(t.identifier),
}));

// Members table - links users to organizations with roles
export const members = pgTable('member', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  userFk: foreignKey({
    columns: [t.userId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  orgFk: foreignKey({
    columns: [t.organizationId],
    foreignColumns: [organizations.id],
  }).onDelete('cascade'),
  uniqueMemberIdx: uniqueIndex('member_unique_idx').on(t.userId, t.organizationId),
  userIdx: index('member_user_idx').on(t.userId),
  orgIdx: index('member_org_idx').on(t.organizationId),
}));

// Invitations table - pending org invitations
export const invitations = pgTable('invitation', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  inviterId: uuid('inviter_id').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  orgFk: foreignKey({
    columns: [t.organizationId],
    foreignColumns: [organizations.id],
  }).onDelete('cascade'),
  inviterFk: foreignKey({
    columns: [t.inviterId],
    foreignColumns: [users.id],
  }).onDelete('cascade'),
  emailOrgIdx: uniqueIndex('invitation_email_org_idx').on(t.email, t.organizationId),
  orgIdx: index('invitation_org_idx').on(t.organizationId),
  statusIdx: index('invitation_status_idx').on(t.status),
}));

// Projects table - sub-tenant under organization
export const projects = pgTable('project', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  orgFk: foreignKey({
    columns: [t.organizationId],
    foreignColumns: [organizations.id],
  }).onDelete('cascade'),
}));

// API Keys table - for ingest authentication
export const apiKeys = pgTable('apiKey', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  // SHA256 Hash of the full key - never store plain text
  keyHash: varchar('key_hash', { length: 64 }).notNull(),
  // Prefix for UI identification (e.g., "pk_live_a1b2...")
  prefix: varchar('prefix', { length: 24 }).notNull(),
  // Scopes for authorization (future use)
  scopes: jsonb('scopes').default([]).notNull(),
  // Track last usage for monitoring
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  // Critical for O(1) lookups during authentication
  hashIdx: uniqueIndex('api_key_hash_idx').on(t.keyHash),
  projectIdx: index('api_key_project_idx').on(t.projectId),
}));

// End Users table - user data ingested via API
export const endUsers = pgTable('endUser', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  // External identifier from customer's system
  externalId: varchar('external_id').notNull(),
  // User metadata stored as JSONB (binary, indexable, faster queries)
  metadata: jsonb('metadata'),
  // Loyalty fields (Issue #15)
  loyaltyPoints: bigint('loyalty_points', { mode: 'number' }).default(0).notNull(),
  tierId: uuid('tier_id'),
  // Issue #20: Commission plan for affiliate earnings
  commissionPlanId: uuid('commission_plan_id'),
  // Issue #20: Unique referral code for affiliate tracking
  referralCode: varchar('referral_code', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  // Composite unique index: (projectId, externalId)
  uniqueUserIdx: uniqueIndex('end_user_external_id_idx').on(t.projectId, t.externalId),
  projectIdx: index('end_user_project_idx').on(t.projectId),
  tierIdx: index('end_user_tier_idx').on(t.tierId),
  referralCodeIdx: uniqueIndex('end_user_referral_code_idx').on(t.projectId, t.referralCode),
}));

// Events table - raw event data (partitioned by month in SQL)
export const events = pgTable('event', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  // Event type for routing in worker
  eventType: varchar('event_type', { length: 255 }).notNull(),
  // External user ID from client system (not a FK - stored as-is)
  userId: varchar('user_id', { length: 255 }),
  // Event payload as JSONB (binary, indexable, faster queries)
  payload: jsonb('payload').notNull(),
  // Processing status
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  // Error details if processing failed
  errorDetails: text('error_details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  projectIdx: index('event_project_idx').on(t.projectId),
  userIdx: index('event_user_idx').on(t.userId),
  statusIdx: index('event_status_idx').on(t.status),
  createdIdx: index('event_created_idx').on(t.createdAt),
}));

// ============================================
// Issue #13: Rule Engine Tables
// ============================================

// Attributes table - field definitions for rules
export const attributes = pgTable('attribute', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Attribute name (e.g., 'cart.total', 'user.tier') */
  name: varchar('name', { length: 255 }).notNull(),
  /** Display name for UI */
  displayName: varchar('display_name', { length: 255 }),
  /** Attribute data type */
  type: varchar('type', { length: 50 }).notNull(), // 'string' | 'number' | 'boolean' | 'date' | 'array'
  /** Description for documentation */
  description: text('description'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  uniqueNameIdx: uniqueIndex('attribute_name_idx').on(t.projectId, t.name),
  projectIdx: index('attribute_project_idx').on(t.projectId),
}));

// Campaigns table - rule containers
export const campaigns = pgTable('campaign', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Campaign name */
  name: varchar('name', { length: 255 }).notNull(),
  /** Campaign description */
  description: text('description'),
  /** Whether campaign is active */
  active: boolean('active').default(true).notNull(),
  /** Priority for rule evaluation (higher = first) */
  priority: integer('priority').default(0).notNull(),
  /** Schedule configuration (JSONB) */
  schedule: jsonb('schedule'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  projectIdx: index('campaign_project_idx').on(t.projectId),
  activeIdx: index('campaign_active_idx').on(t.active),
  priorityIdx: index('campaign_priority_idx').on(t.priority),
}));

// Rules table - logic definitions
export const rules = pgTable('rule', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').notNull(),
  projectId: uuid('project_id').notNull(),
  /** Rule name */
  name: varchar('name', { length: 255 }).notNull(),
  /** Rule description */
  description: text('description'),
  /** Whether rule is active */
  active: boolean('active').default(true).notNull(),
  /** Priority within campaign (higher = first) */
  priority: integer('priority').default(0).notNull(),
  /** Event types this rule applies to */
  eventTypes: jsonb('event_types').default([]).notNull(),
  /** Conditions as JSONB (RuleConditionGroup) */
  conditions: jsonb('conditions').notNull(),
  /** Effects as JSONB (RuleEffect[]) */
  effects: jsonb('effects').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  campaignFk: foreignKey({
    columns: [t.campaignId],
    foreignColumns: [campaigns.id],
  }).onDelete('cascade'),
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  campaignIdx: index('rule_campaign_idx').on(t.campaignId),
  projectIdx: index('rule_project_idx').on(t.projectId),
  activeIdx: index('rule_active_idx').on(t.active),
}));

// ============================================
// Issue #14: Promotion Toolkit Tables
// ============================================

// Customer Sessions table - cart state tracking
export const customerSessions = pgTable('customer_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** External user ID from client system */
  userId: varchar('user_id', { length: 255 }).notNull(),
  /** Session token for client-side reference */
  sessionToken: varchar('session_token', { length: 64 }).notNull(),
  /** Cart items as JSONB */
  items: jsonb('items').default([]).notNull(),
  /** Applied coupon codes */
  coupons: jsonb('coupons').default([]).notNull(),
  /** Original subtotal in cents */
  subtotal: bigint('subtotal', { mode: 'number' }).default(0).notNull(),
  /** Discount amount in cents */
  discount: bigint('discount', { mode: 'number' }).default(0).notNull(),
  /** Final total in cents */
  total: bigint('total', { mode: 'number' }).default(0).notNull(),
  /** Applied effects from rule engine */
  appliedEffects: jsonb('applied_effects').default([]).notNull(),
  /** Session status */
  status: varchar('status', { length: 32 }).default('active').notNull(), // 'active' | 'completed' | 'abandoned'
  /** Currency code (ISO 4217) */
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  /** Session expiry */
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  tokenIdx: uniqueIndex('customer_session_token_idx').on(t.sessionToken),
  projectUserIdx: index('customer_session_project_user_idx').on(t.projectId, t.userId),
  statusIdx: index('customer_session_status_idx').on(t.status),
}));

// Coupons table - discount inventory
export const coupons = pgTable('coupon', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Coupon code (case-insensitive) */
  code: varchar('code', { length: 50 }).notNull(),
  /** Coupon description */
  description: text('description'),
  /** Discount type */
  discountType: varchar('discount_type', { length: 20 }).notNull(), // 'percentage' | 'fixed_amount'
  /** Discount value (percentage as whole number or amount in cents) */
  discountValue: bigint('discount_value', { mode: 'number' }).notNull(),
  /** Minimum cart value to apply (in cents) */
  minimumValue: bigint('minimum_value', { mode: 'number' }).default(0).notNull(),
  /** Maximum discount amount (in cents, for percentage discounts) */
  maximumDiscount: bigint('maximum_discount', { mode: 'number' }),
  /** Maximum total uses (-1 for unlimited) */
  maxUses: integer('max_uses').default(-1).notNull(),
  /** Current usage count */
  usageCount: integer('usage_count').default(0).notNull(),
  /** Maximum uses per user (-1 for unlimited) */
  maxUsesPerUser: integer('max_uses_per_user').default(-1).notNull(),
  /** Whether coupon is active */
  active: boolean('active').default(true).notNull(),
  /** Start date for validity */
  validFrom: timestamp('valid_from'),
  /** End date for validity */
  validUntil: timestamp('valid_until'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  codeIdx: uniqueIndex('coupon_code_idx').on(t.projectId, t.code),
  activeIdx: index('coupon_active_idx').on(t.active),
  projectIdx: index('coupon_project_idx').on(t.projectId),
}));

// Coupon usages table - track per-user usage
export const couponUsages = pgTable('coupon_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  couponId: uuid('coupon_id').notNull(),
  projectId: uuid('project_id').notNull(),
  /** User who used the coupon */
  userId: varchar('user_id', { length: 255 }).notNull(),
  /** Session where coupon was used */
  sessionId: uuid('session_id'),
  /** Order ID if purchase completed */
  orderId: varchar('order_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  couponFk: foreignKey({
    columns: [t.couponId],
    foreignColumns: [coupons.id],
  }).onDelete('cascade'),
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  sessionFk: foreignKey({
    columns: [t.sessionId],
    foreignColumns: [customerSessions.id],
  }).onDelete('set null'),
  couponUserIdx: index('coupon_usage_coupon_user_idx').on(t.couponId, t.userId),
  projectIdx: index('coupon_usage_project_idx').on(t.projectId),
}));

// ============================================
// Issue #15: Loyalty & Retention Tables
// ============================================

// Loyalty Tiers table - tier definitions
export const loyaltyTiers = pgTable('loyalty_tier', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Tier name (e.g., 'Bronze', 'Silver', 'Gold') */
  name: varchar('name', { length: 100 }).notNull(),
  /** Minimum points to reach this tier */
  minPoints: bigint('min_points', { mode: 'number' }).default(0).notNull(),
  /** Benefits as JSONB */
  benefits: jsonb('benefits').default({}).notNull(),
  /** Tier priority/level (higher = better) */
  level: integer('level').default(0).notNull(),
  /** Tier color for UI */
  color: varchar('color', { length: 7 }),
  /** Tier icon URL */
  iconUrl: text('icon_url'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  uniqueNameIdx: uniqueIndex('loyalty_tier_name_idx').on(t.projectId, t.name),
  projectIdx: index('loyalty_tier_project_idx').on(t.projectId),
  levelIdx: index('loyalty_tier_level_idx').on(t.level),
}));

// Loyalty Ledger table - transaction history
export const loyaltyLedger = pgTable('loyalty_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** End user ID (FK to endUsers) */
  endUserId: uuid('end_user_id').notNull(),
  /** Points amount (positive for earn, negative for redeem) */
  amount: bigint('amount', { mode: 'number' }).notNull(),
  /** Balance after transaction */
  balance: bigint('balance', { mode: 'number' }).notNull(),
  /** Transaction type */
  type: varchar('type', { length: 50 }).notNull(), // 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus'
  /** Reference ID (e.g., orderId, eventId) */
  referenceId: varchar('reference_id', { length: 255 }),
  /** Reference type (e.g., 'order', 'event', 'promotion') */
  referenceType: varchar('reference_type', { length: 50 }),
  /** Description of the transaction */
  description: text('description'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  /** Expiry date for earned points */
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  endUserFk: foreignKey({
    columns: [t.endUserId],
    foreignColumns: [endUsers.id],
  }).onDelete('cascade'),
  endUserIdx: index('loyalty_ledger_end_user_idx').on(t.endUserId),
  projectIdx: index('loyalty_ledger_project_idx').on(t.projectId),
  typeIdx: index('loyalty_ledger_type_idx').on(t.type),
  createdIdx: index('loyalty_ledger_created_idx').on(t.createdAt),
}));

// Relations
export const organizationRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
  members: many(members),
  invitations: many(invitations),
}));

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  members: many(members),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const memberRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
}));

export const invitationRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  apiKeys: many(apiKeys),
  endUsers: many(endUsers),
  events: many(events),
  attributes: many(attributes),
  campaigns: many(campaigns),
  rules: many(rules),
  customerSessions: many(customerSessions),
  coupons: many(coupons),
  loyaltyTiers: many(loyaltyTiers),
}));

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
}));

export const endUserRelations = relations(endUsers, ({ one, many }) => ({
  project: one(projects, {
    fields: [endUsers.projectId],
    references: [projects.id],
  }),
  tier: one(loyaltyTiers, {
    fields: [endUsers.tierId],
    references: [loyaltyTiers.id],
  }),
  ledgerEntries: many(loyaltyLedger),
}));

export const eventRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
}));

// Issue #13: Rule Engine Relations
export const attributeRelations = relations(attributes, ({ one }) => ({
  project: one(projects, {
    fields: [attributes.projectId],
    references: [projects.id],
  }),
}));

export const campaignRelations = relations(campaigns, ({ one, many }) => ({
  project: one(projects, {
    fields: [campaigns.projectId],
    references: [projects.id],
  }),
  rules: many(rules),
}));

export const ruleRelations = relations(rules, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [rules.campaignId],
    references: [campaigns.id],
  }),
  project: one(projects, {
    fields: [rules.projectId],
    references: [projects.id],
  }),
}));

// Issue #14: Promotion Toolkit Relations
export const customerSessionRelations = relations(customerSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [customerSessions.projectId],
    references: [projects.id],
  }),
  couponUsages: many(couponUsages),
}));

export const couponRelations = relations(coupons, ({ one, many }) => ({
  project: one(projects, {
    fields: [coupons.projectId],
    references: [projects.id],
  }),
  usages: many(couponUsages),
}));

export const couponUsageRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  project: one(projects, {
    fields: [couponUsages.projectId],
    references: [projects.id],
  }),
  session: one(customerSessions, {
    fields: [couponUsages.sessionId],
    references: [customerSessions.id],
  }),
}));

// Issue #15: Loyalty Relations
export const loyaltyTierRelations = relations(loyaltyTiers, ({ one, many }) => ({
  project: one(projects, {
    fields: [loyaltyTiers.projectId],
    references: [projects.id],
  }),
  members: many(endUsers),
}));

export const loyaltyLedgerRelations = relations(loyaltyLedger, ({ one }) => ({
  project: one(projects, {
    fields: [loyaltyLedger.projectId],
    references: [projects.id],
  }),
  endUser: one(endUsers, {
    fields: [loyaltyLedger.endUserId],
    references: [endUsers.id],
  }),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type EndUser = typeof endUsers.$inferSelect;
export type NewEndUser = typeof endUsers.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// Issue #13: Rule Engine Types
export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type Rule = typeof rules.$inferSelect;
export type NewRule = typeof rules.$inferInsert;

// Issue #14: Promotion Toolkit Types
export type CustomerSession = typeof customerSessions.$inferSelect;
export type NewCustomerSession = typeof customerSessions.$inferInsert;

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export type CouponUsage = typeof couponUsages.$inferSelect;
export type NewCouponUsage = typeof couponUsages.$inferInsert;

// Issue #15: Loyalty Types
export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type NewLoyaltyTier = typeof loyaltyTiers.$inferInsert;

export type LoyaltyLedgerEntry = typeof loyaltyLedger.$inferSelect;
export type NewLoyaltyLedgerEntry = typeof loyaltyLedger.$inferInsert;

// ============================================
// Issue #20: Monetization Schema
// ============================================

// Commission Plans table - defines commission structures
export const commissionPlans = pgTable('commission_plan', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Plan name (e.g., 'Bronze Affiliate', 'Gold Partner') */
  name: varchar('name', { length: 255 }).notNull(),
  /** Description of the plan */
  description: text('description'),
  /** Commission type: PERCENTAGE or FIXED */
  type: varchar('type', { length: 20 }).notNull(), // 'PERCENTAGE' | 'FIXED'
  /** Value in cents or basis points (1000 = 10.00% for percentage, 1000 = $10.00 for fixed) */
  value: integer('value').notNull(),
  /** Currency code (ISO 4217) */
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  /** Whether this is the default plan for the project */
  isDefault: boolean('is_default').default(false).notNull(),
  /** Whether plan is active */
  active: boolean('active').default(true).notNull(),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  projectIdx: index('commission_plan_project_idx').on(t.projectId),
  defaultIdx: index('commission_plan_default_idx').on(t.projectId, t.isDefault),
}));

// Commission Ledger table - immutable transaction history
export const commissionLedger = pgTable('commission_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** End user (affiliate) receiving the commission */
  endUserId: uuid('end_user_id').notNull(),
  /** Commission plan used for calculation */
  commissionPlanId: uuid('commission_plan_id').notNull(),
  /** Commission amount in cents */
  amount: bigint('amount', { mode: 'number' }).notNull(),
  /** Original transaction amount in cents (for audit) */
  sourceAmount: bigint('source_amount', { mode: 'number' }).notNull(),
  /** Status of the commission */
  status: varchar('status', { length: 20 }).default('PENDING').notNull(), // 'PENDING' | 'PAID' | 'REJECTED'
  /** Source event ID for audit trail */
  sourceEventId: uuid('source_event_id'),
  /** Order ID from the purchase */
  orderId: varchar('order_id', { length: 255 }),
  /** Referred user ID (who made the purchase) */
  referredUserId: varchar('referred_user_id', { length: 255 }),
  /** Currency code */
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  /** Notes or rejection reason */
  notes: text('notes'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  /** When the commission was paid */
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  endUserFk: foreignKey({
    columns: [t.endUserId],
    foreignColumns: [endUsers.id],
  }).onDelete('cascade'),
  planFk: foreignKey({
    columns: [t.commissionPlanId],
    foreignColumns: [commissionPlans.id],
  }).onDelete('restrict'),
  eventFk: foreignKey({
    columns: [t.sourceEventId],
    foreignColumns: [events.id],
  }).onDelete('set null'),
  endUserIdx: index('commission_ledger_end_user_idx').on(t.endUserId),
  projectIdx: index('commission_ledger_project_idx').on(t.projectId),
  statusIdx: index('commission_ledger_status_idx').on(t.status),
  createdIdx: index('commission_ledger_created_idx').on(t.createdAt),
}));

// Referral Tracking table - tracks referral relationships
export const referralTracking = pgTable('referral_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** The referrer (affiliate) end user ID */
  referrerId: uuid('referrer_id').notNull(),
  /** The referred user's external ID */
  referredExternalId: varchar('referred_external_id', { length: 255 }).notNull(),
  /** Referral code used */
  referralCode: varchar('referral_code', { length: 100 }).notNull(),
  /** Attribution source (e.g., 'url_param', 'manual') */
  source: varchar('source', { length: 50 }).default('url_param').notNull(),
  /** When the referral was tracked */
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  referrerFk: foreignKey({
    columns: [t.referrerId],
    foreignColumns: [endUsers.id],
  }).onDelete('cascade'),
  uniqueReferralIdx: uniqueIndex('referral_tracking_unique_idx').on(t.projectId, t.referredExternalId),
  referrerIdx: index('referral_tracking_referrer_idx').on(t.referrerId),
  projectIdx: index('referral_tracking_project_idx').on(t.projectId),
  codeIdx: index('referral_tracking_code_idx').on(t.referralCode),
}));

// ============================================
// Issue #21: Progression Engine Tables
// ============================================

// Progression Rules table - defines upgrade conditions
export const progressionRules = pgTable('progression_rule', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Rule name (e.g., 'Gold Tier Upgrade') */
  name: varchar('name', { length: 255 }).notNull(),
  /** Description of the rule */
  description: text('description'),
  /** Metric to evaluate (e.g., 'referral_count', 'total_earnings') */
  triggerMetric: varchar('trigger_metric', { length: 100 }).notNull(),
  /** Threshold value to trigger the rule */
  threshold: integer('threshold').notNull(),
  /** Target commission plan ID when rule triggers */
  actionTargetPlanId: uuid('action_target_plan_id').notNull(),
  /** Priority for rule evaluation (higher = first) */
  priority: integer('priority').default(0).notNull(),
  /** Whether rule is active */
  active: boolean('active').default(true).notNull(),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  targetPlanFk: foreignKey({
    columns: [t.actionTargetPlanId],
    foreignColumns: [commissionPlans.id],
  }).onDelete('cascade'),
  projectIdx: index('progression_rule_project_idx').on(t.projectId),
  metricIdx: index('progression_rule_metric_idx').on(t.triggerMetric),
  activeIdx: index('progression_rule_active_idx').on(t.active),
  priorityIdx: index('progression_rule_priority_idx').on(t.priority),
}));

// Commission Plan Relations
export const commissionPlanRelations = relations(commissionPlans, ({ one, many }) => ({
  project: one(projects, {
    fields: [commissionPlans.projectId],
    references: [projects.id],
  }),
  ledgerEntries: many(commissionLedger),
  progressionRules: many(progressionRules),
}));

export const commissionLedgerRelations = relations(commissionLedger, ({ one }) => ({
  project: one(projects, {
    fields: [commissionLedger.projectId],
    references: [projects.id],
  }),
  endUser: one(endUsers, {
    fields: [commissionLedger.endUserId],
    references: [endUsers.id],
  }),
  commissionPlan: one(commissionPlans, {
    fields: [commissionLedger.commissionPlanId],
    references: [commissionPlans.id],
  }),
  sourceEvent: one(events, {
    fields: [commissionLedger.sourceEventId],
    references: [events.id],
  }),
}));

export const referralTrackingRelations = relations(referralTracking, ({ one }) => ({
  project: one(projects, {
    fields: [referralTracking.projectId],
    references: [projects.id],
  }),
  referrer: one(endUsers, {
    fields: [referralTracking.referrerId],
    references: [endUsers.id],
  }),
}));

export const progressionRuleRelations = relations(progressionRules, ({ one }) => ({
  project: one(projects, {
    fields: [progressionRules.projectId],
    references: [projects.id],
  }),
  targetPlan: one(commissionPlans, {
    fields: [progressionRules.actionTargetPlanId],
    references: [commissionPlans.id],
  }),
}));

// Issue #20 & #21: Types
export type CommissionPlan = typeof commissionPlans.$inferSelect;
export type NewCommissionPlan = typeof commissionPlans.$inferInsert;

export type CommissionLedgerEntry = typeof commissionLedger.$inferSelect;
export type NewCommissionLedgerEntry = typeof commissionLedger.$inferInsert;

export type ReferralTracking = typeof referralTracking.$inferSelect;
export type NewReferralTracking = typeof referralTracking.$inferInsert;

export type ProgressionRule = typeof progressionRules.$inferSelect;
export type NewProgressionRule = typeof progressionRules.$inferInsert;

// ============================================
// Issue #25: Quest Engine Tables
// ============================================

// Quest Definitions table - defines quests
export const questDefinitions = pgTable('quest_definition', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** Quest name */
  name: varchar('name', { length: 255 }).notNull(),
  /** Quest description */
  description: text('description'),
  /** XP reward for completing the quest */
  rewardXp: integer('reward_xp').default(0).notNull(),
  /** Badge ID to award on completion (optional) */
  rewardBadgeId: varchar('reward_badge_id', { length: 255 }),
  /** Whether quest is published/active */
  active: boolean('active').default(false).notNull(),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  projectIdx: index('quest_definition_project_idx').on(t.projectId),
  activeIdx: index('quest_definition_active_idx').on(t.active),
}));

// Quest Steps table - defines steps within a quest
export const questSteps = pgTable('quest_step', {
  id: uuid('id').defaultRandom().primaryKey(),
  questId: uuid('quest_id').notNull(),
  projectId: uuid('project_id').notNull(),
  /** Event name that triggers this step (e.g., 'avatar_uploaded', 'profile.bio_updated') */
  eventName: varchar('event_name', { length: 255 }).notNull(),
  /** Number of times the event must occur to complete the step */
  requiredCount: integer('required_count').default(1).notNull(),
  /** Order index for step ordering */
  orderIndex: integer('order_index').default(0).notNull(),
  /** Step title for display */
  title: varchar('title', { length: 255 }),
  /** Step description */
  description: text('description'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  questFk: foreignKey({
    columns: [t.questId],
    foreignColumns: [questDefinitions.id],
  }).onDelete('cascade'),
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  questIdx: index('quest_step_quest_idx').on(t.questId),
  projectIdx: index('quest_step_project_idx').on(t.projectId),
  eventNameIdx: index('quest_step_event_name_idx').on(t.eventName),
  orderIdx: index('quest_step_order_idx').on(t.questId, t.orderIndex),
}));

// User Quest Progress table - tracks user progress on quests
export const userQuestProgress = pgTable('user_quest_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** End user ID (FK to endUsers) */
  endUserId: uuid('end_user_id').notNull(),
  /** Quest definition ID */
  questId: uuid('quest_id').notNull(),
  /** Status of the quest progress */
  status: varchar('status', { length: 32 }).default('not_started').notNull(), // 'not_started' | 'in_progress' | 'completed'
  /** Percent complete (0-100) */
  percentComplete: integer('percent_complete').default(0).notNull(),
  /** When the quest was started */
  startedAt: timestamp('started_at'),
  /** When the quest was completed */
  completedAt: timestamp('completed_at'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  endUserFk: foreignKey({
    columns: [t.endUserId],
    foreignColumns: [endUsers.id],
  }).onDelete('cascade'),
  questFk: foreignKey({
    columns: [t.questId],
    foreignColumns: [questDefinitions.id],
  }).onDelete('cascade'),
  uniqueProgressIdx: uniqueIndex('user_quest_progress_unique_idx').on(t.endUserId, t.questId),
  projectIdx: index('user_quest_progress_project_idx').on(t.projectId),
  endUserIdx: index('user_quest_progress_end_user_idx').on(t.endUserId),
  questIdx: index('user_quest_progress_quest_idx').on(t.questId),
  statusIdx: index('user_quest_progress_status_idx').on(t.status),
}));

// User Step Progress table - tracks user progress on individual steps
export const userStepProgress = pgTable('user_step_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  /** End user ID (FK to endUsers) */
  endUserId: uuid('end_user_id').notNull(),
  /** Quest step ID */
  stepId: uuid('step_id').notNull(),
  /** User quest progress ID (for easy lookup) */
  userQuestProgressId: uuid('user_quest_progress_id').notNull(),
  /** Current count of events triggered */
  currentCount: integer('current_count').default(0).notNull(),
  /** Whether the step is complete */
  isComplete: boolean('is_complete').default(false).notNull(),
  /** When the step was completed */
  completedAt: timestamp('completed_at'),
  /** Additional metadata */
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  projectFk: foreignKey({
    columns: [t.projectId],
    foreignColumns: [projects.id],
  }).onDelete('cascade'),
  endUserFk: foreignKey({
    columns: [t.endUserId],
    foreignColumns: [endUsers.id],
  }).onDelete('cascade'),
  stepFk: foreignKey({
    columns: [t.stepId],
    foreignColumns: [questSteps.id],
  }).onDelete('cascade'),
  userQuestProgressFk: foreignKey({
    columns: [t.userQuestProgressId],
    foreignColumns: [userQuestProgress.id],
  }).onDelete('cascade'),
  uniqueStepProgressIdx: uniqueIndex('user_step_progress_unique_idx').on(t.endUserId, t.stepId),
  projectIdx: index('user_step_progress_project_idx').on(t.projectId),
  endUserIdx: index('user_step_progress_end_user_idx').on(t.endUserId),
  stepIdx: index('user_step_progress_step_idx').on(t.stepId),
  questProgressIdx: index('user_step_progress_quest_progress_idx').on(t.userQuestProgressId),
}));

// Issue #25: Quest Engine Relations
export const questDefinitionRelations = relations(questDefinitions, ({ one, many }) => ({
  project: one(projects, {
    fields: [questDefinitions.projectId],
    references: [projects.id],
  }),
  steps: many(questSteps),
  userProgress: many(userQuestProgress),
}));

export const questStepRelations = relations(questSteps, ({ one, many }) => ({
  quest: one(questDefinitions, {
    fields: [questSteps.questId],
    references: [questDefinitions.id],
  }),
  project: one(projects, {
    fields: [questSteps.projectId],
    references: [projects.id],
  }),
  userProgress: many(userStepProgress),
}));

export const userQuestProgressRelations = relations(userQuestProgress, ({ one, many }) => ({
  project: one(projects, {
    fields: [userQuestProgress.projectId],
    references: [projects.id],
  }),
  endUser: one(endUsers, {
    fields: [userQuestProgress.endUserId],
    references: [endUsers.id],
  }),
  quest: one(questDefinitions, {
    fields: [userQuestProgress.questId],
    references: [questDefinitions.id],
  }),
  stepProgress: many(userStepProgress),
}));

export const userStepProgressRelations = relations(userStepProgress, ({ one }) => ({
  project: one(projects, {
    fields: [userStepProgress.projectId],
    references: [projects.id],
  }),
  endUser: one(endUsers, {
    fields: [userStepProgress.endUserId],
    references: [endUsers.id],
  }),
  step: one(questSteps, {
    fields: [userStepProgress.stepId],
    references: [questSteps.id],
  }),
  questProgress: one(userQuestProgress, {
    fields: [userStepProgress.userQuestProgressId],
    references: [userQuestProgress.id],
  }),
}));

// Issue #25: Quest Engine Types
export type QuestDefinition = typeof questDefinitions.$inferSelect;
export type NewQuestDefinition = typeof questDefinitions.$inferInsert;

export type QuestStep = typeof questSteps.$inferSelect;
export type NewQuestStep = typeof questSteps.$inferInsert;

export type UserQuestProgress = typeof userQuestProgress.$inferSelect;
export type NewUserQuestProgress = typeof userQuestProgress.$inferInsert;

export type UserStepProgress = typeof userStepProgress.$inferSelect;
export type NewUserStepProgress = typeof userStepProgress.$inferInsert;

// Status types for type-safe handling
export type EventStatus = 'pending' | 'processed' | 'failed';
export type MemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type CustomerSessionStatus = 'active' | 'completed' | 'abandoned';
export type CouponDiscountType = 'percentage' | 'fixed_amount';
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
export type CommissionPlanType = 'PERCENTAGE' | 'FIXED';
export type CommissionStatus = 'PENDING' | 'PAID' | 'REJECTED';
export type QuestProgressStatus = 'not_started' | 'in_progress' | 'completed';
