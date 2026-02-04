import { vi } from "vitest";

process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.PRIVY_APP_ID = "test-app-id";
process.env.PRIVY_APP_SECRET = "test-app-secret";

vi.mock("@privy-io/node", () => {
  class PrivyClientMock {
    constructor() {}
  }

  return { PrivyClient: PrivyClientMock };
});
