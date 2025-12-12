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
}));

export const apiKeyRelations = relations(apiKeys, ({ one }) => ({
  project: one(projects, {
    fields: [apiKeys.projectId],
    references: [projects.id],
  }),
}));

export const endUserRelations = relations(endUsers, ({ one }) => ({
  project: one(projects, {
    fields: [endUsers.projectId],
    references: [projects.id],
  }),
}));

export const eventRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
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

// Status types for type-safe handling
export type EventStatus = 'pending' | 'processed' | 'failed';
export type MemberRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
