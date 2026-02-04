import { describe, it, expect, vi, beforeEach } from "vitest";

let selectResult: any[] = [];
let insertResult: any[] = [];
let updateResult: any[] = [];
let deleteResult: any[] = [];

const whereChain = {
  limit: vi.fn(async () => selectResult),
  then: (resolve: (value: unknown) => void) => resolve(selectResult),
};

const fromChain = {
  where: vi.fn(() => whereChain),
  limit: vi.fn(async () => selectResult),
  then: (resolve: (value: unknown) => void) => resolve(selectResult),
};

const dbMock = {
  select: vi.fn(() => ({
    from: vi.fn(() => fromChain),
  })),
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(async () => insertResult),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => updateResult),
      })),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn(async () => deleteResult),
    })),
  })),
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

vi.mock("../lib/audit-logger", () => ({
  createAuditLog: vi.fn(async () => undefined),
  extractClientInfo: vi.fn(() => ({})),
}));

vi.mock("@repo/db", () => ({
  db: dbMock,
  workflows: { id: "id", userId: "userId" },
  eq: vi.fn(),
}));

const validGraph = {
  nodes: [
    {
      id: "trigger-1",
      type: "trigger",
      position: { x: 0, y: 0 },
      data: {
        nodeType: "trigger",
        triggerType: "cron",
        config: { schedule: "* * * * *" },
      },
    },
    {
      id: "action-1",
      type: "action",
      position: { x: 100, y: 0 },
      data: {
        nodeType: "action",
        actionType: "do_nothing",
        config: {},
      },
    },
  ],
  edges: [],
};

const fetchJson = async (path: string, init?: RequestInit) => {
  const api = (await import("../index")).default;
  const res = await api.fetch(new Request(`http://localhost${path}`, init));
  const body = await res.json();
  return { res, body };
};

describe("Workflows API", () => {
  beforeEach(() => {
    selectResult = [];
    insertResult = [];
    updateResult = [];
    deleteResult = [];
    vi.clearAllMocks();
  });

  it("GET /workflows returns workflows for user", async () => {
    selectResult = [
      { id: "w1", name: "Workflow 1", userId: "user-1" },
      { id: "w2", name: "Workflow 2", userId: "user-1" },
    ];

    const { res, body } = await fetchJson("/workflows");

    expect(res.status).toBe(200);
    expect(body.workflows).toHaveLength(2);
  });

  it("GET /workflows/:id returns a workflow", async () => {
    selectResult = [{ id: "w1", name: "Workflow 1", userId: "user-1" }];

    const { res, body } = await fetchJson("/workflows/w1");

    expect(res.status).toBe(200);
    expect(body.workflow.id).toBe("w1");
  });

  it("GET /workflows/:id returns 404 when missing", async () => {
    selectResult = [];

    const { res, body } = await fetchJson("/workflows/missing");

    expect(res.status).toBe(404);
    expect(body.error).toBe("Workflow not found");
  });

  it("POST /workflows creates a workflow", async () => {
    insertResult = [
      {
        id: "w-new",
        name: "New Workflow",
        userId: "user-1",
        graph: validGraph,
        enabled: false,
      },
    ];

    const { res, body } = await fetchJson("/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Workflow", graph: validGraph }),
    });

    expect(res.status).toBe(201);
    expect(body.workflow.id).toBe("w-new");
  });

  it("PATCH /workflows/:id updates a workflow", async () => {
    selectResult = [{ id: "w1", name: "Old", userId: "user-1", enabled: false }];
    updateResult = [{ id: "w1", name: "Updated", userId: "user-1", enabled: false }];

    const { res, body } = await fetchJson("/workflows/w1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    expect(res.status).toBe(200);
    expect(body.workflow.name).toBe("Updated");
  });

  it("DELETE /workflows/:id deletes a workflow", async () => {
    selectResult = [{ id: "w1", name: "Workflow 1", userId: "user-1", enabled: false }];
    deleteResult = [{ id: "w1", name: "Workflow 1", userId: "user-1", enabled: false }];

    const { res, body } = await fetchJson("/workflows/w1", {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    expect(body.workflow.id).toBe("w1");
  });
});
