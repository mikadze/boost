-- Migration: Add Quest Engine Tables
-- Issue: #25 (Quest Engine Schema & Data Models)
-- Generated: 2024-12-13

-- ============================================
-- Issue #25: Quest Engine Tables
-- ============================================

-- Quest Definitions table - defines quests
CREATE TABLE IF NOT EXISTS "quest_definition" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "description" text,
    "reward_xp" integer NOT NULL DEFAULT 0,
    "reward_badge_id" varchar(255),
    "active" boolean NOT NULL DEFAULT false,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "quest_definition_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "quest_definition_project_idx" ON "quest_definition" ("project_id");
CREATE INDEX IF NOT EXISTS "quest_definition_active_idx" ON "quest_definition" ("active");

-- Quest Steps table - defines steps within a quest
CREATE TABLE IF NOT EXISTS "quest_step" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "quest_id" uuid NOT NULL,
    "project_id" uuid NOT NULL,
    "event_name" varchar(255) NOT NULL,
    "required_count" integer NOT NULL DEFAULT 1,
    "order_index" integer NOT NULL DEFAULT 0,
    "title" varchar(255),
    "description" text,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "quest_step_quest_fk" FOREIGN KEY ("quest_id")
        REFERENCES "quest_definition"("id") ON DELETE CASCADE,
    CONSTRAINT "quest_step_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "quest_step_quest_idx" ON "quest_step" ("quest_id");
CREATE INDEX IF NOT EXISTS "quest_step_project_idx" ON "quest_step" ("project_id");
CREATE INDEX IF NOT EXISTS "quest_step_event_name_idx" ON "quest_step" ("event_name");
CREATE INDEX IF NOT EXISTS "quest_step_order_idx" ON "quest_step" ("quest_id", "order_index");

-- User Quest Progress table - tracks user progress on quests
CREATE TABLE IF NOT EXISTS "user_quest_progress" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "end_user_id" uuid NOT NULL,
    "quest_id" uuid NOT NULL,
    "status" varchar(32) NOT NULL DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
    "percent_complete" integer NOT NULL DEFAULT 0,
    "started_at" timestamp,
    "completed_at" timestamp,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "user_quest_progress_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "user_quest_progress_end_user_fk" FOREIGN KEY ("end_user_id")
        REFERENCES "endUser"("id") ON DELETE CASCADE,
    CONSTRAINT "user_quest_progress_quest_fk" FOREIGN KEY ("quest_id")
        REFERENCES "quest_definition"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_quest_progress_unique_idx" ON "user_quest_progress" ("end_user_id", "quest_id");
CREATE INDEX IF NOT EXISTS "user_quest_progress_project_idx" ON "user_quest_progress" ("project_id");
CREATE INDEX IF NOT EXISTS "user_quest_progress_end_user_idx" ON "user_quest_progress" ("end_user_id");
CREATE INDEX IF NOT EXISTS "user_quest_progress_quest_idx" ON "user_quest_progress" ("quest_id");
CREATE INDEX IF NOT EXISTS "user_quest_progress_status_idx" ON "user_quest_progress" ("status");

-- User Step Progress table - tracks user progress on individual steps
CREATE TABLE IF NOT EXISTS "user_step_progress" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "end_user_id" uuid NOT NULL,
    "step_id" uuid NOT NULL,
    "user_quest_progress_id" uuid NOT NULL,
    "current_count" integer NOT NULL DEFAULT 0,
    "is_complete" boolean NOT NULL DEFAULT false,
    "completed_at" timestamp,
    "metadata" jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    CONSTRAINT "user_step_progress_project_fk" FOREIGN KEY ("project_id")
        REFERENCES "project"("id") ON DELETE CASCADE,
    CONSTRAINT "user_step_progress_end_user_fk" FOREIGN KEY ("end_user_id")
        REFERENCES "endUser"("id") ON DELETE CASCADE,
    CONSTRAINT "user_step_progress_step_fk" FOREIGN KEY ("step_id")
        REFERENCES "quest_step"("id") ON DELETE CASCADE,
    CONSTRAINT "user_step_progress_quest_progress_fk" FOREIGN KEY ("user_quest_progress_id")
        REFERENCES "user_quest_progress"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_step_progress_unique_idx" ON "user_step_progress" ("end_user_id", "step_id");
CREATE INDEX IF NOT EXISTS "user_step_progress_project_idx" ON "user_step_progress" ("project_id");
CREATE INDEX IF NOT EXISTS "user_step_progress_end_user_idx" ON "user_step_progress" ("end_user_id");
CREATE INDEX IF NOT EXISTS "user_step_progress_step_idx" ON "user_step_progress" ("step_id");
CREATE INDEX IF NOT EXISTS "user_step_progress_quest_progress_idx" ON "user_step_progress" ("user_quest_progress_id");
