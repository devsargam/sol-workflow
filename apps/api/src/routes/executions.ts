import { Hono } from "hono";

const executions = new Hono();

// Temporary in-memory storage (will be replaced with database)
const executionsStore = new Map();

// List executions with optional workflow filter
executions.get("/", async (c) => {
  const workflowId = c.req.query("workflow_id");

  let executions = Array.from(executionsStore.values());

  if (workflowId) {
    executions = executions.filter((e) => e.workflowId === workflowId);
  }

  // Sort by timestamp descending
  executions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return c.json({ executions });
});

// Get execution by ID
executions.get("/:id", async (c) => {
  const id = c.req.param("id");
  const execution = executionsStore.get(id);

  if (!execution) {
    return c.json({ error: "Execution not found" }, 404);
  }

  return c.json({ execution });
});

export default executions;
