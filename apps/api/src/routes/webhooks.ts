import { Hono, type Context } from "hono";
import type { Queue } from "bullmq";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import {
  WebhookTriggerConfigSchema,
  X402PaymentTriggerConfigSchema,
  isTriggerNode,
  type WebhookTriggerConfig,
  type WorkflowGraph,
  type X402PaymentTriggerConfig,
} from "@repo/types";
import { generateExecutionId, JOB_NAMES, JOB_OPTIONS, TriggerType, log } from "utils";
import { z } from "zod";
import {
  X402_SOLANA_DEVNET_NETWORK,
  createX402ErrorResponse,
  getX402RuntimeConfig,
  processX402Request,
  settleX402Payment,
} from "../lib/x402";

type WebhookTriggerMatch = {
  workflow: typeof workflowsTable.$inferSelect;
  triggerNodeId: string;
  trigger: ParsedWebhookTrigger;
};

type ParsedWebhookTrigger =
  | {
      valid: true;
      triggerType: TriggerType.WEBHOOK;
      config: WebhookTriggerConfig;
    }
  | {
      valid: true;
      triggerType: TriggerType.X402_PAYMENT;
      config: X402PaymentTriggerConfig;
    }
  | {
      valid: false;
      triggerType: TriggerType.WEBHOOK | TriggerType.X402_PAYMENT;
      errors: string[];
    };

type X402PaymentResult = {
  headers: Record<string, string>;
  metadata: {
    protocol: "x402";
    price: string;
    network: string;
    payTo: string;
    facilitatorUrl: string;
    settlement: unknown;
  };
};

const WebhookLocatorConfigSchema = z.object({
  webhookId: z.string().trim().min(1),
});

function formatConfigIssues(error: z.ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "config";
    return `${path}: ${issue.message}`;
  });
}

function parseWebhookTrigger(triggerType: unknown, config: unknown): ParsedWebhookTrigger | null {
  if (triggerType === TriggerType.WEBHOOK) {
    const result = WebhookTriggerConfigSchema.safeParse(config ?? {});

    return result.success
      ? {
          valid: true,
          triggerType: TriggerType.WEBHOOK,
          config: result.data,
        }
      : {
          valid: false,
          triggerType: TriggerType.WEBHOOK,
          errors: formatConfigIssues(result.error),
        };
  }

  if (triggerType === TriggerType.X402_PAYMENT) {
    const result = X402PaymentTriggerConfigSchema.safeParse(config ?? {});

    return result.success
      ? {
          valid: true,
          triggerType: TriggerType.X402_PAYMENT,
          config: result.data,
        }
      : {
          valid: false,
          triggerType: TriggerType.X402_PAYMENT,
          errors: formatConfigIssues(result.error),
        };
  }

  return null;
}

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
    if (!isTriggerNode(node)) continue;
    if (expectedTriggerNodeId && node.id !== expectedTriggerNodeId) continue;

    const triggerData = node.data as { triggerType?: unknown; config?: unknown };
    const trigger = parseWebhookTrigger(triggerData?.triggerType, triggerData?.config);
    if (!trigger) continue;

    const locator = WebhookLocatorConfigSchema.safeParse(triggerData.config ?? {});
    if (locator.success && locator.data.webhookId === webhookId) {
      return {
        triggerNodeId: node.id,
        trigger,
      };
    }
  }

  return null;
}

function jsonSafe(value: unknown) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function getX402TriggerSettings(config: X402PaymentTriggerConfig) {
  const runtime = getX402RuntimeConfig();

  return {
    payTo: config.payTo,
    price: config.price,
    network: config.network,
    description: config.description,
    facilitatorUrl: runtime.facilitatorUrl,
  };
}

async function verifyAndSettleX402Payment({
  c,
  workflowName,
  config,
  acceptedPayload,
}: {
  c: Context;
  workflowName: string;
  config: X402PaymentTriggerConfig;
  acceptedPayload: Record<string, unknown>;
}): Promise<{ response: Response } | { payment: X402PaymentResult }> {
  const settings = getX402TriggerSettings(config);

  if (settings.network !== X402_SOLANA_DEVNET_NETWORK) {
    return {
      response: c.json({ error: "Unsupported x402 network for this deployment" }, 500),
    };
  }

  const { httpServer, requestContext, result } = await processX402Request(c, {
    accepts: {
      scheme: "exact",
      price: settings.price,
      network: settings.network,
      payTo: settings.payTo,
    },
    resource: c.req.url,
    description: settings.description || `${workflowName} paid webhook trigger`,
    mimeType: "application/json",
    unpaidResponseBody: () => ({
      contentType: "application/json",
      body: {
        error: "Payment required",
        triggerType: TriggerType.X402_PAYMENT,
      },
    }),
    settlementFailedResponseBody: (_context, settleResult) => ({
      contentType: "application/json",
      body: {
        error: "Payment settlement failed",
        reason: settleResult.errorReason,
      },
    }),
  });

  if (result.type === "payment-error") {
    return { response: createX402ErrorResponse(result.response) };
  }

  if (result.type !== "payment-verified") {
    return {
      response: c.json({ error: "Payment required" }, 402),
    };
  }

  const settlement = await settleX402Payment({
    httpServer,
    requestContext,
    result,
    responseBody: Buffer.from(JSON.stringify(acceptedPayload)),
    responseHeaders: {
      "content-type": "application/json",
    },
  });

  if (!settlement.success) {
    return { response: createX402ErrorResponse(settlement.response) };
  }

  const { headers, response: _response, requirements: _requirements, ...settlementData } =
    settlement as Record<string, unknown>;

  return {
    payment: {
      headers: headers as Record<string, string>,
      metadata: {
        protocol: "x402",
        price: settings.price,
        network: settings.network,
        payTo: settings.payTo,
        facilitatorUrl: settings.facilitatorUrl,
        settlement: jsonSafe(settlementData),
      },
    },
  };
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
      trigger: match.trigger,
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
      trigger: match.trigger,
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

  const { workflow, triggerNodeId: resolvedTriggerNodeId, trigger } = resolved;
  const graph = workflow.graph as WorkflowGraph;

  if (!trigger.valid) {
    return c.json(
      {
        error: "Invalid webhook trigger configuration",
        details: trigger.errors,
      },
      500
    );
  }

  if (trigger.triggerType === TriggerType.WEBHOOK && trigger.config.authEnabled) {
    const receivedAuthValue = c.req.header(trigger.config.authHeaderName);

    if (receivedAuthValue !== trigger.config.authHeaderValue) {
      return c.json({ error: "Unauthorized webhook request" }, 401);
    }
  }

  const method = c.req.method.toUpperCase();
  const requestUrl = new URL(c.req.url);
  const contentType = c.req.header("content-type") || "";
  const headers = normalizeHeaderMap(c.req.raw.headers);
  const query = normalizeQuery(requestUrl);
  const requestId =
    headers["x-request-id"] ||
    headers["x-idempotency-key"] ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const executionId = generateExecutionId(
    workflow.id,
    Date.now(),
    `${resolvedTriggerNodeId}:${webhookId}:${requestId}`
  );
  const acceptedPayload = {
    accepted: true,
    executionId,
    workflowId: workflow.id,
    triggerNodeId: resolvedTriggerNodeId,
  };

  const x402Payment =
    trigger.triggerType === TriggerType.X402_PAYMENT
      ? await verifyAndSettleX402Payment({
          c,
          workflowName: workflow.name,
          config: trigger.config,
          acceptedPayload,
        })
      : null;

  if (x402Payment && "response" in x402Payment) {
    return x402Payment.response;
  }

  const { body, rawBody } = await readRequestBody(c.req.raw.clone(), method, contentType);

  const input =
    body && typeof body === "object" && !Array.isArray(body) ? { ...query, ...body } : body ?? query;

  await queue.add(
    JOB_NAMES.WORKFLOW_EVENT,
    {
      workflowId: workflow.id,
      executionId,
      triggerNodeId: resolvedTriggerNodeId,
      triggerData: {
        type: trigger.triggerType,
        firedAt: new Date().toISOString(),
        requestId,
        method,
        url: c.req.url,
        path: requestUrl.pathname,
        webhookId: trigger.config.webhookId,
        headers,
        query,
        body,
        input,
        rawBody,
        auth:
          trigger.triggerType === TriggerType.WEBHOOK
            ? {
                enabled: trigger.config.authEnabled,
                headerName: trigger.config.authEnabled ? trigger.config.authHeaderName : null,
                verified: trigger.config.authEnabled,
              }
            : {
                enabled: false,
                headerName: null,
                verified: false,
              },
        payment: x402Payment && "payment" in x402Payment ? x402Payment.payment.metadata : undefined,
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

  if (x402Payment && "payment" in x402Payment) {
    for (const [key, value] of Object.entries(x402Payment.payment.headers)) {
      c.header(key, value);
    }
  }

  return c.json(acceptedPayload, 202);
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
