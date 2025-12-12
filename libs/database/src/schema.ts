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

// Status types for type-safe handling
export type EventStatus = 'pending' | 'processed' | 'failed';
export type MemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type CustomerSessionStatus = 'active' | 'completed' | 'abandoned';
export type CouponDiscountType = 'percentage' | 'fixed_amount';
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
