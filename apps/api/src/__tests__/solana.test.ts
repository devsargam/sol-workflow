import { describe, it, expect, vi } from "vitest";

const defaultConnection = {
  getSlot: vi.fn(async () => 123),
  getBlockHeight: vi.fn(async () => 456),
  getAccountInfo: vi.fn(async () => ({
    lamports: 1000,
    owner: { toBase58: () => "OwnerPubKey" },
    executable: false,
    rentEpoch: 1,
    data: new Uint8Array([1, 2, 3]),
  })),
};

vi.mock("@repo/solana", () => ({
  getDefaultConnection: () => defaultConnection,
  getBalance: async () => ({ address: "TestAddress", lamports: 12345, sol: 0.000012345 }),
  formatBalance: (lamports: number) => `${lamports} lamports`,
}));

vi.mock("ioredis", () => {
  class RedisMock {
    ping() {
      return Promise.resolve("PONG");
    }
  }

  return { default: RedisMock };
});

vi.mock("bullmq", () => {
  class QueueMock {
    constructor() {}
  }

  return { Queue: QueueMock };
});

vi.mock("../lib/cron-scheduler", () => {
  class CronSchedulerMock {
    async reconcileAll() {
      return { added: 0, removed: 0 };
    }

    validateWorkflowCronTriggers() {
      return { valid: true, errors: [] };
    }

    async getStats() {
      return { activeCronJobs: 0 };
    }

    async syncWorkflowCronJobs() {
      return undefined;
    }

    async removeAllForWorkflow() {
      return undefined;
    }
  }

  return { CronScheduler: CronSchedulerMock };
});

const dbMock = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      limit: vi.fn(async () => []),
      where: vi.fn(() => ({
        limit: vi.fn(async () => []),
      })),
      then: (resolve: (value: unknown) => void) => resolve([]),
    })),
  })),
};

vi.mock("@repo/db", () => ({
  db: dbMock,
  workflows: { id: "id", userId: "userId" },
  eq: vi.fn(),
  and: vi.fn(),
}));

const fetchJson = async (path: string) => {
  const api = (await import("../index")).default;
  const res = await api.fetch(new Request(`http://localhost${path}`));
  const body = await res.json();
  return { res, body };
};

describe("Solana API", () => {
  it("GET /solana/health returns connection info", async () => {
    const { res, body } = await fetchJson("/solana/health");

    expect(res.status).toBe(200);
    expect(body.connected).toBe(true);
    expect(body.slot).toBe(123);
    expect(body.blockHeight).toBe(456);
  });

  it("GET /solana/balance/:address validates address", async () => {
    const { res, body } = await fetchJson("/solana/balance/short");

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid Solana address");
  });

  it("GET /solana/balance/:address returns balance", async () => {
    const { res, body } = await fetchJson("/solana/balance/11111111111111111111111111111111");

    expect(res.status).toBe(200);
    expect(body.lamports).toBe(12345);
    expect(body.formatted).toBe("12345 lamports");
  });

  it("GET /solana/account/:address validates address", async () => {
    const { res, body } = await fetchJson("/solana/account/short");

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid Solana address");
  });

  it("GET /solana/account/:address returns account info", async () => {
    const { res, body } = await fetchJson("/solana/account/11111111111111111111111111111111");

    expect(res.status).toBe(200);
    expect(body.owner).toBe("OwnerPubKey");
    expect(body.dataLength).toBe(3);
  });
});
