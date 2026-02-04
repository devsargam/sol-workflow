import { describe, it, expect, vi } from "vitest";

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

    async getStats() {
      return { activeCronJobs: 0 };
    }
  }

  return { CronScheduler: CronSchedulerMock };
});

vi.mock("@repo/db", () => {
  const fromResult = {
    limit: vi.fn(async () => []),
    then: (resolve: (value: unknown) => void) => resolve([]),
  };

  return {
    db: {
      select: vi.fn(() => ({
        from: vi.fn(() => fromResult),
      })),
    },
    workflows: {},
    eq: vi.fn(),
  };
});

// Import after mocks are set up
import api from "../index";

const fetchJson = async (path: string) => {
  const res = await api.fetch(new Request(`http://localhost${path}`));
  const body = await res.json();
  return { res, body };
};

describe("API health endpoints", () => {
  it("/live returns alive", async () => {
    const { res, body } = await fetchJson("/live");

    expect(res.status).toBe(200);
    expect(body).toEqual({ alive: true });
  });

  it("/ready returns ready true when deps respond", async () => {
    const { res, body } = await fetchJson("/ready");

    expect(res.status).toBe(200);
    expect(body).toEqual({ ready: true });
  });

  it("/health returns ok with healthy services", async () => {
    const { res, body } = await fetchJson("/health");

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.services.database.status).toBe("healthy");
    expect(body.services.redis.status).toBe("healthy");
  });
});
