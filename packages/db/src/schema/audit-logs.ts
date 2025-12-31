import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Related workflow (nullable for system-level events)
  workflowId: uuid("workflow_id").references(() => workflows.id, { onDelete: "set null" }),

  // Event details
  eventType: text("event_type").notNull(), // workflow_created, workflow_updated, workflow_enabled, etc.
  eventData: jsonb("event_data").notNull(),

  // Actor (for future user management)
  actorId: text("actor_id"),
  actorType: text("actor_type").default("system"), // system, user, api

  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  // Timestamp
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
