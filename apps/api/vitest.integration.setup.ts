import { beforeEach, vi } from "vitest";
import { db, executions, workflows } from "@repo/db";
import { seedDatabase } from "./src/__tests__/integration/seed";

process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-auth-secret";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.NODE_ENV = "test";
process.env.ENABLE_CRON = "false";

vi.mock("./src/lib/audit-logger", () => ({
  createAuditLog: vi.fn(async () => undefined),
  extractClientInfo: vi.fn(() => ({})),
}));

beforeEach(async () => {
  await db.delete(executions);
  await db.delete(workflows);
  await seedDatabase();
});
