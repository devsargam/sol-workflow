import { Hono, type Context } from "hono";
import type { Queue } from "bullmq";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import type { WorkflowGraph } from "@repo/types";
import { generateExecutionId, JOB_NAMES, JOB_OPTIONS, NodeType, TriggerType, log } from "utils";

type WebhookTriggerMatch = {
  workflow: typeof workflowsTable.$inferSelect;
  triggerNodeId: string;
  triggerData: {
    triggerType?: string;
    config?: {
      webhookId?: string;
      authEnabled?: boolean;
      authHeaderName?: string;
      authHeaderValue?: string;
    };
  };
};

function normalizeHeaderMap(headers: Headers) {
  const mapped: Record<string, string> = {};

  for (const [key, value] of headers.entries()) {
    mapped[key] = value;
  }

  return mapped;
}

function normalizeQuery(url: URL) {
  const query: Record<string, string | string[]> = {};

  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length <= 1 ? (values[0] ?? "") : values;
  }

  return query;
}

async function readRequestBody(request: Request, method: string, contentType: string) {
  if (method === "GET" || method === "HEAD") {
    return { body: null, rawBody: "" };
  }

  const rawBody = await request.text().catch(() => "");

  if (!rawBody) {
    return { body: null, rawBody };
  }

  if (contentType.includes("application/json")) {
    try {
      return { body: JSON.parse(rawBody), rawBody };
    } catch {
      return { body: rawBody, rawBody };
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return {
      body: Object.fromEntries(new URLSearchParams(rawBody).entries()),
      rawBody,
    };
  }

  return { body: rawBody, rawBody };
}

function findWebhookTriggerInGraph(
  graph: WorkflowGraph,
  webhookId: string,
  expectedTriggerNodeId?: string
) {
  for (const node of graph.nodes) {
    if (node.type !== NodeType.TRIGGER) continue;
    if (expectedTriggerNodeId && node.id !== expectedTriggerNodeId) continue;

    const triggerData = node.data as WebhookTriggerMatch["triggerData"];
    if (
      triggerData?.triggerType === TriggerType.WEBHOOK &&
      triggerData.config?.webhookId === webhookId
    ) {
      return {
        triggerNodeId: node.id,
        triggerData,
      };
    }
  }

  return null;
}

async function resolveWebhookTrigger(
  webhookId: string,
  workflowId?: string,
  triggerNodeId?: string
): Promise<WebhookTriggerMatch | null> {
  if (workflowId) {
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, workflowId))
      .limit(1);

    if (!workflow || !workflow.enabled) return null;

    const match = findWebhookTriggerInGraph(workflow.graph as WorkflowGraph, webhookId, triggerNodeId);
    if (!match) return null;

    return {
      workflow,
      triggerNodeId: match.triggerNodeId,
      triggerData: match.triggerData,
    };
  }

  const workflows = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.enabled, true));

  const matches: WebhookTriggerMatch[] = [];

  for (const workflow of workflows) {
    const match = findWebhookTriggerInGraph(workflow.graph as WorkflowGraph, webhookId);
    if (!match) continue;

    matches.push({
      workflow,
      triggerNodeId: match.triggerNodeId,
      triggerData: match.triggerData,
    });
  }

  if (matches.length !== 1) {
    return null;
  }

  return matches[0] ?? null;
}

async function handleWebhookRequest(
  c: Context,
  queue: Queue,
  {
    workflowId,
    triggerNodeId,
    webhookId,
  }: {
    workflowId?: string;
    triggerNodeId?: string;
    webhookId: string;
  }
) {
  const resolved = await resolveWebhookTrigger(webhookId, workflowId, triggerNodeId);

  if (!resolved) {
    return c.json({ error: "Webhook trigger not found" }, 404);
  }

  const { workflow, triggerNodeId: resolvedTriggerNodeId, triggerData } = resolved;
  const graph = workflow.graph as WorkflowGraph;

  const authEnabled = Boolean(triggerData.config?.authEnabled);
  const authHeaderName = triggerData.config?.authHeaderName || "Authorization";
  const expectedAuthValue = triggerData.config?.authHeaderValue;

  if (authEnabled) {
    const receivedAuthValue = c.req.header(authHeaderName);

    if (!expectedAuthValue || receivedAuthValue !== expectedAuthValue) {
      return c.json({ error: "Unauthorized webhook request" }, 401);
    }
  }

  const method = c.req.method.toUpperCase();
  const requestUrl = new URL(c.req.url);
  const contentType = c.req.header("content-type") || "";
  const { body, rawBody } = await readRequestBody(c.req.raw.clone(), method, contentType);
  const headers = normalizeHeaderMap(c.req.raw.headers);
  const query = normalizeQuery(requestUrl);
  const requestId =
    headers["x-request-id"] ||
    headers["x-idempotency-key"] ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const input =
    body && typeof body === "object" && !Array.isArray(body) ? { ...query, ...body } : body ?? query;

  const executionId = generateExecutionId(
    workflow.id,
    Date.now(),
    `${resolvedTriggerNodeId}:${webhookId}:${requestId}`
  );

  await queue.add(
    JOB_NAMES.WORKFLOW_EVENT,
    {
      workflowId: workflow.id,
      executionId,
      triggerNodeId: resolvedTriggerNodeId,
      triggerData: {
        type: TriggerType.WEBHOOK,
        firedAt: new Date().toISOString(),
        requestId,
        method,
        url: c.req.url,
        path: requestUrl.pathname,
        webhookId,
        headers,
        query,
        body,
        input,
        rawBody,
        auth: {
          enabled: authEnabled,
          headerName: authEnabled ? authHeaderName : null,
          verified: authEnabled,
        },
      },
      graph,
      metadata: workflow.metadata,
    },
    {
      jobId: executionId,
      ...JOB_OPTIONS.DEFAULT,
    }
  );

  log.info(`Webhook trigger queued for workflow ${workflow.id}`, {
    service: "api",
    workflowId: workflow.id,
    triggerNodeId: resolvedTriggerNodeId,
    executionId,
    method,
  });

  return c.json(
    {
      accepted: true,
      executionId,
      workflowId: workflow.id,
      triggerNodeId: resolvedTriggerNodeId,
    },
    202
  );
}

export function createWebhookRoutes(queue: Queue) {
  const webhooks = new Hono();

  webhooks.all("/:webhookId", async (c) => {
    try {
      return await handleWebhookRequest(c, queue, {
        webhookId: c.req.param("webhookId"),
      });
    } catch (error) {
      log.error("Failed to handle webhook trigger", error as Error, {
        service: "api",
      });
      return c.json({ error: "Failed to process webhook trigger" }, 500);
    }
  });

  webhooks.all("/:workflowId/:triggerNodeId/:webhookId", async (c) => {
    try {
      return await handleWebhookRequest(c, queue, {
        workflowId: c.req.param("workflowId"),
        triggerNodeId: c.req.param("triggerNodeId"),
        webhookId: c.req.param("webhookId"),
      });
    } catch (error) {
      log.error("Failed to handle webhook trigger", error as Error, {
        service: "api",
      });
      return c.json({ error: "Failed to process webhook trigger" }, 500);
    }
  });

  return webhooks;
}
