import { zValidator } from "@hono/zod-validator";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import { WORKFLOW_METADATA } from "utils";
import {
  WebhookTriggerConfigSchema,
  WorkflowGraphSchema,
  WorkflowMetadataSchema,
  X402PaymentTriggerConfigSchema,
  isExecutableGraph,
  validateWorkflowGraph,
  validateWorkflowGraphForBuilder,
  type WorkflowGraph,
} from "@repo/types";
import { Hono } from "hono";
import { z } from "zod";
import { getCronScheduler } from "../cron";
import { authMiddleware, AuthenticatedContext } from "../middleware/auth";
import { createAuditLog, extractClientInfo } from "../lib/audit-logger";
import {
  buildAgentWorkflowCapabilities,
  buildWorkflowAgentDetail,
} from "../lib/agent-workflow-catalog";

const workflows = new Hono();

workflows.use("*", authMiddleware);

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  graph: WorkflowGraphSchema,
  metadata: WorkflowMetadataSchema.optional(),
});

const validateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  graph: z.unknown(),
  metadata: WorkflowMetadataSchema.optional(),
});

function formatZodIssues(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "body",
    message: issue.message,
  }));
}

function getAuditActor(c: AuthenticatedContext) {
  const user = c.user;

  return {
    actorId: user?.authMethod === "api_key" ? user.apiKeyId : user?.id,
    actorType: user?.authMethod === "api_key" ? ("api" as const) : ("user" as const),
  };
}

function validateWebhookTriggerConfigs(graph: WorkflowGraph) {
  const errors: string[] = [];

  for (const node of graph.nodes) {
    if (node.type !== "trigger") continue;

    const triggerData = node.data as {
      triggerType?: string;
      config?: unknown;
    };

    const schema =
      triggerData.triggerType === "webhook"
        ? WebhookTriggerConfigSchema
        : triggerData.triggerType === "x402_payment"
          ? X402PaymentTriggerConfigSchema
          : null;

    if (!schema) {
      continue;
    }

    const result = schema.safeParse(triggerData.config ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path.length > 0 ? issue.path.join(".") : "config";
        errors.push(`Trigger node ${node.id}: ${path}: ${issue.message}`);
      }
    }
  }

  return errors;
}

function validateWorkflowDraft(data: unknown) {
  const bodyResult = validateWorkflowSchema.safeParse(data);

  if (!bodyResult.success) {
    return {
      valid: false,
      errors: ["Workflow validation request is malformed"],
      checks: {
        body: {
          valid: false,
          errors: formatZodIssues(bodyResult.error),
        },
      },
    };
  }

  const graphResult = WorkflowGraphSchema.safeParse(bodyResult.data.graph);

  if (!graphResult.success) {
    return {
      valid: false,
      errors: ["Invalid workflow graph structure"],
      checks: {
        body: { valid: true, errors: [] },
        graphSchema: {
          valid: false,
          errors: formatZodIssues(graphResult.error),
        },
      },
    };
  }

  const graph = graphResult.data;
  const executable = isExecutableGraph(graph);
  const builderErrors = validateWorkflowGraphForBuilder(graph);
  const webhookErrors = validateWebhookTriggerConfigs(graph);

  const cronScheduler = getCronScheduler();
  const cronValidation = cronScheduler
    ? cronScheduler.validateWorkflowCronTriggers(graph)
    : { valid: true, errors: [] };

  const errors = [
    ...executable.errors,
    ...webhookErrors,
    ...cronValidation.errors,
  ];

  return {
    valid: errors.length === 0,
    errors,
    checks: {
      body: { valid: true, errors: [] },
      graphSchema: { valid: true, errors: [] },
      executableGraph: {
        valid: executable.valid,
        errors: executable.errors,
      },
      nodeConfiguration: {
        valid: webhookErrors.length === 0,
        errors: webhookErrors,
      },
      cron: cronValidation,
      builder: {
        valid: builderErrors.length === 0,
        errors: builderErrors,
        note:
          "Builder validation mirrors the visual UI and may be stricter than API execution validation.",
      },
    },
    summary: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      triggerCount: graph.nodes.filter((node) => node.type === "trigger").length,
      filterCount: graph.nodes.filter((node) => node.type === "filter").length,
      actionCount: graph.nodes.filter((node) => node.type === "action").length,
      notifyCount: graph.nodes.filter((node) => node.type === "notify").length,
    },
  };
}

workflows.get("/", async (c: AuthenticatedContext) => {
  try {
    const userId = c.user?.id;
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allWorkflows = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.userId, userId));

    return c.json({ workflows: allWorkflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return c.json({ error: "Failed to fetch workflows" }, 500);
  }
});

workflows.get("/agent/capabilities", (c: AuthenticatedContext) => {
  const userId = c.user?.id;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json(buildAgentWorkflowCapabilities());
});

workflows.post("/validate", async (c: AuthenticatedContext) => {
  const userId = c.user?.id;
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const data = await c.req.json();
    const result = validateWorkflowDraft(data);
    return c.json(result, result.valid ? 200 : 422);
  } catch (error) {
    return c.json(
      {
        valid: false,
        errors: ["Request body must be valid JSON"],
        checks: {
          body: {
            valid: false,
            errors: [{ path: "body", message: (error as Error).message }],
          },
        },
      },
      400
    );
  }
});

workflows.get("/:id/agent", async (c: AuthenticatedContext) => {
  try {
    const userId = c.user?.id;
    const id = c.req.param("id");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    if (workflow.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json(buildWorkflowAgentDetail(workflow));
  } catch (error) {
    console.error("Error fetching agent workflow detail:", error);
    return c.json({ error: "Failed to fetch agent workflow detail" }, 500);
  }
});

workflows.get("/:id", async (c: AuthenticatedContext) => {
  try {
    const userId = c.user?.id;
    const id = c.req.param("id");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    if (workflow.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json({ workflow });
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return c.json({ error: "Failed to fetch workflow" }, 500);
  }
});

// Create workflow
workflows.post("/", zValidator("json", createWorkflowSchema), async (c) => {
  try {
    const ctx = c as unknown as AuthenticatedContext;
    const userId = ctx.user?.id;
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const data = c.req.valid("json");

    // Validate the graph structure
    try {
      validateWorkflowGraph(data.graph);
    } catch (validationError) {
      return c.json(
        {
          error: "Invalid workflow graph structure",
          details: (validationError as Error).message,
        },
        400
      );
    }

    // Check if the graph is executable
    const { valid, errors } = isExecutableGraph(data.graph);
    if (!valid) {
      return c.json(
        {
          error: "Workflow graph is not executable",
          details: errors,
        },
        400
      );
    }

    const configurationErrors = validateWebhookTriggerConfigs(data.graph);
    if (configurationErrors.length > 0) {
      return c.json(
        {
          error: "Workflow graph has invalid node configuration",
          details: configurationErrors,
        },
        400
      );
    }

    // Validate cron triggers if present
    const cronScheduler = getCronScheduler();
    if (cronScheduler) {
      const cronValidation = cronScheduler.validateWorkflowCronTriggers(data.graph);
      if (!cronValidation.valid) {
        return c.json(
          {
            error: "Invalid cron trigger configuration",
            details: cronValidation.errors,
          },
          400
        );
      }
    }

    const [workflow] = await db
      .insert(workflowsTable)
      .values({
        name: data.name,
        description: data.description,
        userId: userId,
        graph: data.graph,
        metadata: data.metadata || {
          version: WORKFLOW_METADATA.VERSION,
          maxSolPerTx: WORKFLOW_METADATA.LIMITS.MAX_SOL_PER_TX,
          maxExecutionsPerHour: WORKFLOW_METADATA.LIMITS.MAX_EXECUTIONS_PER_HOUR,
          createdWith: WORKFLOW_METADATA.CREATED_WITH.API,
        },
        enabled: false,
      })
      .returning();

    // Note: Cron jobs are not scheduled here since workflow is created as disabled
    // They will be scheduled when the workflow is enabled via toggle

    // Log workflow creation
    if (workflow) {
      const clientInfo = extractClientInfo(c);
      const actor = getAuditActor(ctx);
      await createAuditLog({
        workflowId: workflow.id,
        eventType: "workflow_created",
        eventData: {
          name: workflow.name,
          description: workflow.description,
          nodeCount: data.graph.nodes.length,
          edgeCount: data.graph.edges.length,
        },
        ...actor,
        ...clientInfo,
      });
    }

    return c.json({ workflow }, 201);
  } catch (error) {
    console.error("Error creating workflow:", error);
    return c.json({ error: "Failed to create workflow" }, 500);
  }
});

// Update workflow (check ownership)
workflows.patch("/:id", zValidator("json", createWorkflowSchema.partial()), async (c) => {
  try {
    const ctx = c as unknown as AuthenticatedContext;
    const userId = ctx.user?.id;
    const id = c.req.param("id");
    const data = c.req.valid("json");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check ownership
    const [existing] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    if (existing.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const updateData: any = { updatedAt: new Date() };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.graph) {
      // Validate the graph structure
      try {
        validateWorkflowGraph(data.graph);
      } catch (validationError) {
        return c.json(
          {
            error: "Invalid workflow graph structure",
            details: (validationError as Error).message,
          },
          400
        );
      }

      // Check if the graph is executable
      const { valid, errors } = isExecutableGraph(data.graph);
      if (!valid) {
        return c.json(
          {
            error: "Workflow graph is not executable",
            details: errors,
          },
          400
        );
      }

      const configurationErrors = validateWebhookTriggerConfigs(data.graph);
      if (configurationErrors.length > 0) {
        return c.json(
          {
            error: "Workflow graph has invalid node configuration",
            details: configurationErrors,
          },
          400
        );
      }

      // Validate cron triggers if present
      const cronScheduler = getCronScheduler();
      if (cronScheduler) {
        const cronValidation = cronScheduler.validateWorkflowCronTriggers(data.graph);
        if (!cronValidation.valid) {
          return c.json(
            {
              error: "Invalid cron trigger configuration",
              details: cronValidation.errors,
            },
            400
          );
        }
      }

      updateData.graph = data.graph;
    }

    if (data.metadata) {
      updateData.metadata = {
        ...data.metadata,
        lastModifiedWith: "api",
      };
    }

    const [workflow] = await db
      .update(workflowsTable)
      .set(updateData)
      .where(eq(workflowsTable.id, id))
      .returning();

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    // Sync cron jobs if workflow is enabled and graph was updated
    const cronScheduler = getCronScheduler();
    if (cronScheduler && workflow.enabled && data.graph) {
      await cronScheduler.syncWorkflowCronJobs(
        workflow.id,
        workflow.graph as any,
        workflow.metadata,
        workflow.enabled
      );
    }

    // Log workflow update
    const clientInfo = extractClientInfo(c);
    const actor = getAuditActor(ctx);
    await createAuditLog({
      workflowId: workflow.id,
      eventType: "workflow_updated",
      eventData: {
        updatedFields: Object.keys(data),
        previousName: existing.name,
        newName: workflow.name,
      },
      ...actor,
      ...clientInfo,
    });

    return c.json({ workflow });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return c.json({ error: "Failed to update workflow" }, 500);
  }
});

workflows.delete("/:id", async (c: AuthenticatedContext) => {
  try {
    const userId = c.user?.id;
    const id = c.req.param("id");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check ownership
    const [existing] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    if (existing.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const cronScheduler = getCronScheduler();
    if (cronScheduler) {
      await cronScheduler.removeAllForWorkflow(id);
    }

    const [workflow] = await db.delete(workflowsTable).where(eq(workflowsTable.id, id)).returning();

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    // Log workflow deletion
    const clientInfo = extractClientInfo(c as any);
    const actor = getAuditActor(c);
    await createAuditLog({
      workflowId: id, // Use original ID since workflow is deleted
      eventType: "workflow_deleted",
      eventData: {
        name: workflow.name,
        wasEnabled: workflow.enabled,
      },
      ...actor,
      ...clientInfo,
    });

    return c.json({ workflow });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return c.json({ error: "Failed to delete workflow" }, 500);
  }
});

// Toggle workflow enabled/disabled (check ownership)
workflows.post("/:id/toggle", async (c: AuthenticatedContext) => {
  try {
    const userId = c.user?.id;
    const id = c.req.param("id");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Fetch current workflow
    const [current] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!current) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    // Check ownership
    if (current.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const newEnabledState = !current.enabled;

    // Toggle enabled status
    const [workflow] = await db
      .update(workflowsTable)
      .set({
        enabled: newEnabledState,
        updatedAt: new Date(),
      })
      .where(eq(workflowsTable.id, id))
      .returning();

    if (!workflow) {
      return c.json({ error: "Failed to update workflow" }, 500);
    }

    // Sync cron jobs based on new enabled state
    const cronScheduler = getCronScheduler();
    if (cronScheduler) {
      await cronScheduler.syncWorkflowCronJobs(
        workflow.id,
        workflow.graph as any,
        workflow.metadata,
        newEnabledState
      );
    }

    // Log workflow enable/disable
    const clientInfo = extractClientInfo(c as any);
    const actor = getAuditActor(c);
    await createAuditLog({
      workflowId: workflow.id,
      eventType: newEnabledState ? "workflow_enabled" : "workflow_disabled",
      eventData: {
        name: workflow.name,
        previousState: current.enabled,
        newState: newEnabledState,
      },
      ...actor,
      ...clientInfo,
    });

    return c.json({ workflow });
  } catch (error) {
    console.error("Error toggling workflow:", error);
    return c.json({ error: "Failed to toggle workflow" }, 500);
  }
});

export default workflows;
