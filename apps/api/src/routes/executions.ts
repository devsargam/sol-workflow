import { Hono, Context } from "hono";
import { db, executions as executionsTable, workflows as workflowsTable, eq, and } from "@repo/db";
import { authMiddleware, AuthenticatedContext } from "../middleware/auth";

const executions = new Hono();

// Apply auth middleware to all routes
executions.use("*", authMiddleware);

// List executions with optional workflow filter
executions.get("/", async (c: Context) => {
  try {
    const ctx = c as unknown as AuthenticatedContext;
    const userId = ctx.user?.id;

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const workflowId = c.req.query("workflow_id");
    const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);
    const offset = parseInt(c.req.query("offset") || "0");

    // First get user's workflows to filter executions
    const userWorkflows = await db
      .select({ id: workflowsTable.id })
      .from(workflowsTable)
      .where(eq(workflowsTable.userId, userId));

    const userWorkflowIds = userWorkflows.map((w) => w.id);

    if (userWorkflowIds.length === 0) {
      return c.json({ executions: [], total: 0 });
    }

    // Build query based on filters
    let allExecutions;
    let total;

    if (workflowId) {
      // Verify the workflow belongs to the user
      if (!userWorkflowIds.includes(workflowId)) {
        return c.json({ error: "Forbidden" }, 403);
      }

      allExecutions = await db
        .select()
        .from(executionsTable)
        .where(eq(executionsTable.workflowId, workflowId))
        .orderBy(executionsTable.startedAt)
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ count: executionsTable.id })
        .from(executionsTable)
        .where(eq(executionsTable.workflowId, workflowId));

      total = countResult ? 1 : 0; // Simple count approximation
    } else {
      // Get all executions for user's workflows
      // Using a subquery approach for multiple workflow IDs
      allExecutions = await db
        .select()
        .from(executionsTable)
        .innerJoin(workflowsTable, eq(executionsTable.workflowId, workflowsTable.id))
        .where(eq(workflowsTable.userId, userId))
        .orderBy(executionsTable.startedAt)
        .limit(limit)
        .offset(offset);

      // Map to just execution data
      allExecutions = allExecutions.map((row) => row.executions);
      total = allExecutions.length;
    }

    return c.json({
      executions: allExecutions,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching executions:", error);
    return c.json({ error: "Failed to fetch executions" }, 500);
  }
});

// Get execution by ID
executions.get("/:id", async (c: Context) => {
  try {
    const ctx = c as unknown as AuthenticatedContext;
    const userId = ctx.user?.id;
    const id = c.req.param("id");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get execution with workflow join to verify ownership
    const [result] = await db
      .select()
      .from(executionsTable)
      .innerJoin(workflowsTable, eq(executionsTable.workflowId, workflowsTable.id))
      .where(eq(executionsTable.id, id))
      .limit(1);

    if (!result) {
      return c.json({ error: "Execution not found" }, 404);
    }

    // Verify ownership
    if (result.workflows.userId !== userId) {
      return c.json({ error: "Forbidden" }, 403);
    }

    return c.json({ execution: result.executions });
  } catch (error) {
    console.error("Error fetching execution:", error);
    return c.json({ error: "Failed to fetch execution" }, 500);
  }
});

// Get execution stats for a workflow
executions.get("/stats/:workflowId", async (c: Context) => {
  try {
    const ctx = c as unknown as AuthenticatedContext;
    const userId = ctx.user?.id;
    const workflowId = c.req.param("workflowId");

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Verify workflow ownership
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(and(eq(workflowsTable.id, workflowId), eq(workflowsTable.userId, userId)))
      .limit(1);

    if (!workflow) {
      return c.json({ error: "Workflow not found or forbidden" }, 404);
    }

    // Get execution counts by status
    const allExecutions = await db
      .select()
      .from(executionsTable)
      .where(eq(executionsTable.workflowId, workflowId));

    const stats = {
      total: allExecutions.length,
      pending: allExecutions.filter((e) => e.status === "pending").length,
      processing: allExecutions.filter((e) => e.status === "processing").length,
      success: allExecutions.filter((e) => e.status === "success").length,
      failed: allExecutions.filter((e) => e.status === "failed").length,
      filtered: allExecutions.filter((e) => e.status === "filtered").length,
      lastExecution: allExecutions.length > 0 ? allExecutions[allExecutions.length - 1] : null,
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Error fetching execution stats:", error);
    return c.json({ error: "Failed to fetch execution stats" }, 500);
  }
});

export default executions;
