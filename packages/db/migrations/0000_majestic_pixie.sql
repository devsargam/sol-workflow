CREATE TABLE IF NOT EXISTS "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb NOT NULL,
	"filter_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_type" text NOT NULL,
	"action_config" jsonb NOT NULL,
	"notify_type" text DEFAULT 'discord' NOT NULL,
	"notify_webhook_url" text NOT NULL,
	"notify_template" text NOT NULL,
	"max_sol_per_tx" integer DEFAULT 1000000,
	"max_executions_per_hour" integer DEFAULT 10,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" varchar(64) NOT NULL,
	"workflow_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"trigger_data" jsonb NOT NULL,
	"tx_signature" text,
	"tx_error" text,
	"notification_sent" timestamp,
	"notification_error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "executions_execution_id_unique" UNIQUE("execution_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trigger_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"subscription_type" text NOT NULL,
	"solana_address" text,
	"active" text DEFAULT 'true' NOT NULL,
	"subscription_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_event_at" timestamp,
	"error_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"last_error_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid,
	"event_type" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"actor_id" text,
	"actor_type" text DEFAULT 'system',
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "executions" ADD CONSTRAINT "executions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trigger_subscriptions" ADD CONSTRAINT "trigger_subscriptions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
