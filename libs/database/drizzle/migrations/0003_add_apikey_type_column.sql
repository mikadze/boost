-- Add type column to apiKey table for distinguishing publishable vs secret keys
ALTER TABLE "apiKey" ADD COLUMN IF NOT EXISTS "type" varchar(20) DEFAULT 'secret' NOT NULL;

-- Add index for type lookups
CREATE INDEX IF NOT EXISTS "api_key_type_idx" ON "apiKey" ("type");
