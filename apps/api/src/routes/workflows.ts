import { zValidator } from "@hono/zod-validator";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import { WORKFLOW_METADATA } from "utils";
import {
  WorkflowGraphSchema,
  WorkflowMetadataSchema,
  isExecutableGraph,
  validateWorkflowGraph,
} from "@repo/types";
import { Hono } from "hono";
import { z } from "zod";
import { getCronScheduler } from "../index";
import { authMiddleware, AuthenticatedContext } from "../middleware/auth";

const workflows = new Hono();

// Apply auth middleware to all routes
workflows.use("*", authMiddleware);

// Validation schema for creating/updating workflows
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  graph: WorkflowGraphSchema,
  metadata: WorkflowMetadataSchema.optional(),
});

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

    return c.json({ workflow });
  } catch (error) {
    console.error("Error toggling workflow:", error);
    return c.json({ error: "Failed to toggle workflow" }, 500);
  }
});

export default workflows;
