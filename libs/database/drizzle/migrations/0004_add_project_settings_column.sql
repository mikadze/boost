-- Add settings column to project table for storing project-level configuration
-- Settings include: referral program config, incentives, etc.
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "settings" jsonb DEFAULT '{}' NOT NULL;
