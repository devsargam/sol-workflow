import { pgTable, text, timestamp, boolean, jsonb, uuid, integer } from "drizzle-orm/pg-core";

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),

  // Trigger configuration
  triggerType: text("trigger_type").notNull(), // balance_change, token_receipt, etc.
  triggerConfig: jsonb("trigger_config").notNull(),

  // Filter configuration
  filterConditions: jsonb("filter_conditions").notNull().default([]),

  // Action configuration
  actionType: text("action_type").notNull(), // send_sol, send_spl_token, call_program
  actionConfig: jsonb("action_config").notNull(),

  // Notification configuration
  notifyType: text("notify_type").notNull().default("discord"),
  notifyWebhookUrl: text("notify_webhook_url").notNull(),
  notifyTemplate: text("notify_template").notNull(),

  // Safety limits
  maxSolPerTx: integer("max_sol_per_tx").default(1000000), // in lamports
  maxExecutionsPerHour: integer("max_executions_per_hour").default(10),

  // Status
  enabled: boolean("enabled").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
