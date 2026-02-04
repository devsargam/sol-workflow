import { describe, it, expect } from "vitest";
import { EXECUTION_UUID, OTHER_WORKFLOW_ID, WORKFLOW_ID } from "./seed";

const fetchJson = async (path: string) => {
  const api = (await import("../../index")).default;
  const res = await api.fetch(
    new Request(`http://localhost${path}`, {
      headers: {
        Authorization: "Bearer test-token",
      },
    })
  );
  const body = await res.json();
  return { res, body };
};

describe("Executions API (integration)", () => {
  it("GET /executions returns executions", async () => {
    const { res, body } = await fetchJson("/executions");

    expect(res.status).toBe(200);
    expect(body.executions.length).toBeGreaterThanOrEqual(2);
  });

  it("GET /executions?workflow_id returns executions for workflow", async () => {
    const { res, body } = await fetchJson(`/executions?workflow_id=${WORKFLOW_ID}`);

    expect(res.status).toBe(200);
    expect(body.executions[0].workflowId).toBe(WORKFLOW_ID);
  });

  it("GET /executions/:id returns execution", async () => {
    const { res, body } = await fetchJson(`/executions/${EXECUTION_UUID}`);

    expect(res.status).toBe(200);
    expect(body.execution.id).toBe(EXECUTION_UUID);
  });

  it("GET /executions/stats/:workflowId returns stats", async () => {
    const { res, body } = await fetchJson(`/executions/stats/${OTHER_WORKFLOW_ID}`);

    expect(res.status).toBe(200);
    expect(body.stats.total).toBeGreaterThanOrEqual(1);
  });
});
