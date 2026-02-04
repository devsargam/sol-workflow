import { vi } from "vitest";

process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.PRIVY_APP_ID = "test-app-id";
process.env.PRIVY_APP_SECRET = "test-app-secret";
process.env.NODE_ENV = "test";
process.env.ENABLE_CRON = "false";

vi.mock("@privy-io/node", () => {
  class PrivyClientMock {
    constructor() {}
  }

  return { PrivyClient: PrivyClientMock };
});
