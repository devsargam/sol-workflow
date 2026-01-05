ALTER TABLE "workflows" ADD COLUMN IF NOT EXISTS "user_id" text;

CREATE INDEX IF NOT EXISTS "idx_workflows_user_id" ON "workflows"("user_id");

