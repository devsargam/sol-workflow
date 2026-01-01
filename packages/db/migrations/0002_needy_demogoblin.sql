ALTER TABLE "workflows" ALTER COLUMN "graph" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" ALTER COLUMN "metadata" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "trigger_type";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "trigger_config";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "filter_conditions";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "action_type";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "action_config";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "notify_type";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "notify_webhook_url";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "notify_template";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "max_sol_per_tx";--> statement-breakpoint
ALTER TABLE "workflows" DROP COLUMN IF EXISTS "max_executions_per_hour";