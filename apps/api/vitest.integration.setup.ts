import { beforeEach, vi } from "vitest";
import { db, executions, workflows } from "@repo/db";
import { seedDatabase } from "./src/__tests__/integration/seed";

process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
process.env.PRIVY_APP_ID = process.env.PRIVY_APP_ID || "test-app-id";
process.env.PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET || "test-app-secret";
process.env.NODE_ENV = "test";
process.env.ENABLE_CRON = "false";

vi.mock("@privy-io/node", () => {
  class PrivyClientMock {
    utils() {
      return {
        auth() {
          return {
            verifyAuthToken: async () => ({ userId: "user-1" }),
          };
        },
      };
    }

    users() {
      return {
        _get: async () => ({
          linked_accounts: [{ type: "email", address: "user@test.com" }],
        }),
      };
    }
  }

  return { PrivyClient: PrivyClientMock };
});

vi.mock("./src/lib/audit-logger", () => ({
  createAuditLog: vi.fn(async () => undefined),
  extractClientInfo: vi.fn(() => ({})),
}));

beforeEach(async () => {
  await db.delete(executions);
  await db.delete(workflows);
  await seedDatabase();
});
