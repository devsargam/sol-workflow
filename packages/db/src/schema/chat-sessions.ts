import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    messages: jsonb("messages").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userUpdatedAtIdx: index("chat_sessions_user_updated_at_idx").on(
      table.userId,
      table.updatedAt
    ),
  })
);

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
