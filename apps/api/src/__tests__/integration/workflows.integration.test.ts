import { describe, it, expect } from "vitest";
import { OTHER_WORKFLOW_ID, WORKFLOW_ID, validGraph } from "./seed";

const fetchJson = async (path: string, init?: RequestInit) => {
  const api = (await import("../../index")).default;
  const res = await api.fetch(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: {
        Authorization: "Bearer test-token",
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    })
  );
  const body = await res.json();
  return { res, body };
};

describe("Workflows API (integration)", () => {
  it("GET /workflows returns seeded workflows", async () => {
    const { res, body } = await fetchJson("/workflows");

    expect(res.status).toBe(200);
    expect(body.workflows).toHaveLength(2);
  });

  it("GET /workflows/:id returns workflow", async () => {
    const { res, body } = await fetchJson(`/workflows/${WORKFLOW_ID}`);

    expect(res.status).toBe(200);
    expect(body.workflow.id).toBe(WORKFLOW_ID);
  });

  it("POST /workflows creates a workflow", async () => {
    const { res, body } = await fetchJson("/workflows", {
      method: "POST",
      body: JSON.stringify({ name: "Integration Workflow", graph: validGraph }),
    });

    expect(res.status).toBe(201);
    expect(body.workflow.name).toBe("Integration Workflow");
  });

  it("PATCH /workflows/:id updates workflow", async () => {
    const { res, body } = await fetchJson(`/workflows/${OTHER_WORKFLOW_ID}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Integration" }),
    });

    expect(res.status).toBe(200);
    expect(body.workflow.name).toBe("Updated Integration");
  });

  it("DELETE /workflows/:id deletes workflow", async () => {
    const { res, body } = await fetchJson(`/workflows/${WORKFLOW_ID}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
    expect(body.workflow.id).toBe(WORKFLOW_ID);
  });
});
