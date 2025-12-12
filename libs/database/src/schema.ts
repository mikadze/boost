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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
  // User ID the event belongs to
  userId: uuid('user_id'),
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
  userFk: foreignKey({
    columns: [t.userId],
    foreignColumns: [endUsers.id],
  }).onDelete('set null'),
  projectIdx: index('event_project_idx').on(t.projectId),
  userIdx: index('event_user_idx').on(t.userId),
  statusIdx: index('event_status_idx').on(t.status),
  createdIdx: index('event_created_idx').on(t.createdAt),
}));

// Relations
export const organizationRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
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

export const endUserRelations = relations(endUsers, ({ one, many }) => ({
  project: one(projects, {
    fields: [endUsers.projectId],
    references: [projects.id],
  }),
  events: many(events),
}));

export const eventRelations = relations(events, ({ one }) => ({
  project: one(projects, {
    fields: [events.projectId],
    references: [projects.id],
  }),
  user: one(endUsers, {
    fields: [events.userId],
    references: [endUsers.id],
  }),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type EndUser = typeof endUsers.$inferSelect;
export type NewEndUser = typeof endUsers.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// Event status type for type-safe status handling
export type EventStatus = 'pending' | 'processed' | 'failed';
