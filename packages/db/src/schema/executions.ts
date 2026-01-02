import { ExecutionStatus } from "utils";
import { pgTable, text, timestamp, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const executions = pgTable("executions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Unique execution identifier (for idempotency)
  executionId: varchar("execution_id", { length: 64 }).notNull().unique(),

  // Related workflow
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => workflows.id, { onDelete: "cascade" }),

  // Execution status
  status: text("status").notNull().default(ExecutionStatus.PENDING), // pending, processing, success, failed, filtered

  // Trigger data
  triggerData: jsonb("trigger_data").notNull(),

  // Action result
  txSignature: text("tx_signature"),
  txError: text("tx_error"),

  // Notification result
  notificationSent: timestamp("notification_sent"),
  notificationError: text("notification_error"),

  // Timestamps
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),

  // Metadata
  metadata: jsonb("metadata").default({}),
});

export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
