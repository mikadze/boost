-- Migration: Add Monetization Schema & Progression Engine Tables
-- Issues: #20 (Monetization), #21 (Progression)
-- Generated: 2024-12-13

-- ============================================
-- Issue #20: Monetization Schema
-- ============================================

-- Commission Plans table - defines commission structures
CREATE TABLE IF NOT EXISTS "commission_plan" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "type" varchar(20) NOT NULL, -- 'PERCENTAGE' | 'FIXED'
    "value" integer NOT NULL, -- cents or basis points (1000 = 10.00%)
    "currency" varchar(3) NOT NULL DEFAULT 'USD',
    "is_default" boolean NOT NULL DEFAULT false,
    "active" boolean NOT NULL DEFAULT true,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "commission_plan_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "commission_plan_project_idx" ON "commission_plan" ("project_id");
CREATE INDEX IF NOT EXISTS "commission_plan_default_idx" ON "commission_plan" ("project_id", "is_default");

-- Commission Ledger table - immutable transaction history
CREATE TABLE IF NOT EXISTS "commission_ledger" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "end_user_id" uuid NOT NULL,
    "commission_plan_id" uuid NOT NULL,
    "amount" bigint NOT NULL, -- in cents
    "source_amount" bigint NOT NULL, -- original transaction amount in cents
    "status" varchar(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'PAID' | 'REJECTED'
    "source_event_id" uuid,
    "order_id" varchar(255),
    "referred_user_id" varchar(255),
    "currency" varchar(3) NOT NULL DEFAULT 'USD',
    "notes" text,
    "metadata" jsonb,
    "paid_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "commission_ledger_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "commission_ledger_end_user_fk" FOREIGN KEY ("end_user_id")
        REFERENCES "endUser"("id") ON DELETE CASCADE,
    CONSTRAINT "commission_ledger_plan_fk" FOREIGN KEY ("commission_plan_id")
        REFERENCES "commission_plan"("id") ON DELETE RESTRICT,
    CONSTRAINT "commission_ledger_event_fk" FOREIGN KEY ("source_event_id")
        REFERENCES "event"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "commission_ledger_end_user_idx" ON "commission_ledger" ("end_user_id");
CREATE INDEX IF NOT EXISTS "commission_ledger_project_idx" ON "commission_ledger" ("project_id");
CREATE INDEX IF NOT EXISTS "commission_ledger_status_idx" ON "commission_ledger" ("status");
CREATE INDEX IF NOT EXISTS "commission_ledger_created_idx" ON "commission_ledger" ("created_at");

-- Referral Tracking table - tracks referral relationships
CREATE TABLE IF NOT EXISTS "referral_tracking" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "referrer_id" uuid NOT NULL,
    "referred_external_id" varchar(255) NOT NULL,
    "referral_code" varchar(100) NOT NULL,
    "source" varchar(50) NOT NULL DEFAULT 'url_param',
    "created_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "referral_tracking_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "referral_tracking_referrer_fk" FOREIGN KEY ("referrer_id")
        REFERENCES "endUser"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "referral_tracking_unique_idx" ON "referral_tracking" ("project_id", "referred_external_id");
CREATE INDEX IF NOT EXISTS "referral_tracking_referrer_idx" ON "referral_tracking" ("referrer_id");
CREATE INDEX IF NOT EXISTS "referral_tracking_project_idx" ON "referral_tracking" ("project_id");
CREATE INDEX IF NOT EXISTS "referral_tracking_code_idx" ON "referral_tracking" ("referral_code");

-- ============================================
-- Issue #21: Progression Engine Tables
-- ============================================

-- Progression Rules table - defines upgrade conditions
CREATE TABLE IF NOT EXISTS "progression_rule" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "trigger_metric" varchar(100) NOT NULL, -- e.g., 'referral_count', 'total_earnings'
    "threshold" integer NOT NULL,
    "action_target_plan_id" uuid NOT NULL,
    "priority" integer NOT NULL DEFAULT 0,
    "active" boolean NOT NULL DEFAULT true,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "progression_rule_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "progression_rule_target_plan_fk" FOREIGN KEY ("action_target_plan_id")
        REFERENCES "commission_plan"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "progression_rule_project_idx" ON "progression_rule" ("project_id");
CREATE INDEX IF NOT EXISTS "progression_rule_metric_idx" ON "progression_rule" ("trigger_metric");
CREATE INDEX IF NOT EXISTS "progression_rule_active_idx" ON "progression_rule" ("active");
CREATE INDEX IF NOT EXISTS "progression_rule_priority_idx" ON "progression_rule" ("priority");

-- ============================================
-- Modify endUsers table for Issue #20
-- ============================================

-- Add commission_plan_id column to endUsers
ALTER TABLE "endUser"
ADD COLUMN IF NOT EXISTS "commission_plan_id" uuid;

-- Add referral_code column to endUsers
ALTER TABLE "endUser"
ADD COLUMN IF NOT EXISTS "referral_code" varchar(100);

-- Create unique index on referral_code (per project)
CREATE UNIQUE INDEX IF NOT EXISTS "end_user_referral_code_idx" ON "endUser" ("project_id", "referral_code");
