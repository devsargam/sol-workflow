import { describe, it, expect, vi, beforeEach } from "vitest";

let selectResult: any[] = [];
let selectWorkflowIdsResult: any[] = [];
let selectCountResult: any[] = [];
let selectQueue: any[][] = [];

const getSelectResult = () => (selectQueue.length ? selectQueue.shift()! : selectResult);

const makeChain = (getter: () => any[]) => {
  const chain: any = {
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    offset: vi.fn(async () => getter()),
    then: (resolve: (value: unknown) => void) => resolve(getter()),
  };
  return chain;
};

const selectChain = makeChain(getSelectResult);
const selectWorkflowIdsChain = makeChain(() => selectWorkflowIdsResult);
const selectCountChain = makeChain(() => selectCountResult);

const dbMock = {
  select: vi.fn((args?: any) => {
    if (args && Object.prototype.hasOwnProperty.call(args, "count")) {
      return { from: vi.fn(() => selectCountChain) };
    }
    if (args && Object.prototype.hasOwnProperty.call(args, "id")) {
      return { from: vi.fn(() => selectWorkflowIdsChain) };
    }
    return { from: vi.fn(() => selectChain) };
  }),
};

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

vi.mock("../middleware/auth", () => ({
  authMiddleware: async (c: any, next: any) => {
    c.user = { id: "user-1", email: "user@test.com" };
    await next();
  },
}));

vi.mock("@repo/db", () => ({
  db: dbMock,
  executions: { id: "id", workflowId: "workflowId", startedAt: "startedAt" },
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

describe("Executions API", () => {
  beforeEach(() => {
    selectResult = [];
    selectWorkflowIdsResult = [];
    selectCountResult = [];
    selectQueue = [];
    vi.clearAllMocks();
  });

  it("GET /executions returns empty when user has no workflows", async () => {
    selectWorkflowIdsResult = [];

    const { res, body } = await fetchJson("/executions");

    expect(res.status).toBe(200);
    expect(body.executions).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /executions returns executions for user workflows", async () => {
    selectWorkflowIdsResult = [{ id: "w1" }, { id: "w2" }];
    selectResult = [{ executions: { id: "e1" } }, { executions: { id: "e2" } }];

    const { res, body } = await fetchJson("/executions");

    expect(res.status).toBe(200);
    expect(body.executions).toHaveLength(2);
    expect(body.pagination.total).toBe(2);
  });

  it("GET /executions?workflow_id returns 403 for non-owned workflow", async () => {
    selectWorkflowIdsResult = [{ id: "w1" }];

    const { res, body } = await fetchJson("/executions?workflow_id=w2");

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("GET /executions?workflow_id returns executions for workflow", async () => {
    selectWorkflowIdsResult = [{ id: "w1" }];
    selectResult = [{ id: "e1", workflowId: "w1" }];
    selectCountResult = [{ count: "1" }];

    const { res, body } = await fetchJson("/executions?workflow_id=w1");

    expect(res.status).toBe(200);
    expect(body.executions).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it("GET /executions/:id returns execution when owned", async () => {
    selectResult = [{ executions: { id: "e1" }, workflows: { userId: "user-1" } }];

    const { res, body } = await fetchJson("/executions/e1");

    expect(res.status).toBe(200);
    expect(body.execution.id).toBe("e1");
  });

  it("GET /executions/:id returns 403 when not owned", async () => {
    selectResult = [{ executions: { id: "e1" }, workflows: { userId: "other" } }];

    const { res, body } = await fetchJson("/executions/e1");

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("GET /executions/stats/:workflowId returns stats", async () => {
    selectQueue = [
      [{ id: "w1" }],
      [{ status: "success" }, { status: "failed" }, { status: "success" }],
    ];

    const { res, body } = await fetchJson("/executions/stats/w1");

    expect(res.status).toBe(200);
    expect(body.stats.total).toBe(3);
    expect(body.stats.success).toBe(2);
    expect(body.stats.failed).toBe(1);
  });
});
