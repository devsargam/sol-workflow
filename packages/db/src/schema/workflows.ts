import { pgTable, text, timestamp, boolean, jsonb, uuid } from "drizzle-orm/pg-core";

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),

  // User ownership
  userId: text("user_id"), // Privy user ID

  // Graph-based workflow definition
  graph: jsonb("graph").notNull(), // Contains nodes and edges for the workflow
  metadata: jsonb("metadata").notNull(), // Contains safety limits, version, etc.

  // Status
  enabled: boolean("enabled").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
