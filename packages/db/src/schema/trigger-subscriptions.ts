import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const triggerSubscriptions = pgTable("trigger_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Related workflow
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),

  // Subscription details
  subscriptionType: text("subscription_type").notNull(), // account, logs, signature
  solanaAddress: text("solana_address"), // Account or program address being monitored

  // Status
  active: text("active").notNull().default("true"),
  subscriptionId: integer("subscription_id"), // Solana subscription ID

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastEventAt: timestamp("last_event_at"),

  // Error tracking
  errorCount: integer("error_count").notNull().default(0),
  lastError: text("last_error"),
  lastErrorAt: timestamp("last_error_at"),
});

export type TriggerSubscription = typeof triggerSubscriptions.$inferSelect;
export type NewTriggerSubscription = typeof triggerSubscriptions.$inferInsert;
