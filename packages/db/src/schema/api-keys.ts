import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(), // Wallet address
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(), // sha256 hash of the full key
    keyPrefix: text("key_prefix").notNull(), // First chars for display (dk_live_abc1...)
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at"),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    userIdx: index("api_keys_user_id_idx").on(table.userId),
  })
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
