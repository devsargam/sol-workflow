import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, workflows as workflowsTable } from "@repo/db";
import { eq, isNull } from "drizzle-orm";

const workflows = new Hono();

// Validation schemas (will be moved to @repo/types)
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.object({
    type: z.enum(["balance_change", "token_receipt", "nft_receipt", "transaction_status", "program_log"]),
    config: z.record(z.any()),
  }),
  filter: z.object({
    conditions: z.array(z.record(z.any())),
  }),
  action: z.object({
    type: z.enum(["send_sol", "send_spl_token", "call_program"]),
    config: z.record(z.any()),
  }),
  notify: z.object({
    type: z.literal("discord"),
    webhookUrl: z.string().url(),
    template: z.string(),
  }),
});

// List all workflows
workflows.get("/", async (c) => {
  try {
    const allWorkflows = await db.select().from(workflowsTable).where(isNull(workflowsTable.deletedAt));
    return c.json({ workflows: allWorkflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return c.json({ error: "Failed to fetch workflows" }, 500);
  }
});

// Get workflow by ID
workflows.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
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
    const data = c.req.valid("json");

    const [workflow] = await db
      .insert(workflowsTable)
      .values({
        name: data.name,
        description: data.description,
        triggerType: data.trigger.type,
        triggerConfig: data.trigger.config,
        filterConditions: data.filter.conditions,
        actionType: data.action.type,
        actionConfig: data.action.config,
        notifyType: data.notify.type,
        notifyWebhookUrl: data.notify.webhookUrl,
        notifyTemplate: data.notify.template,
        enabled: false,
      })
      .returning();

    return c.json({ workflow }, 201);
  } catch (error) {
    console.error("Error creating workflow:", error);
    return c.json({ error: "Failed to create workflow" }, 500);
  }
});

// Update workflow
workflows.patch("/:id", zValidator("json", createWorkflowSchema.partial()), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const updateData: any = { updatedAt: new Date() };

    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.trigger) {
      updateData.triggerType = data.trigger.type;
      updateData.triggerConfig = data.trigger.config;
    }
    if (data.filter) updateData.filterConditions = data.filter.conditions;
    if (data.action) {
      updateData.actionType = data.action.type;
      updateData.actionConfig = data.action.config;
    }
    if (data.notify) {
      updateData.notifyType = data.notify.type;
      updateData.notifyWebhookUrl = data.notify.webhookUrl;
      updateData.notifyTemplate = data.notify.template;
    }

    const [workflow] = await db
      .update(workflowsTable)
      .set(updateData)
      .where(eq(workflowsTable.id, id))
      .returning();

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    return c.json({ workflow });
  } catch (error) {
    console.error("Error updating workflow:", error);
    return c.json({ error: "Failed to update workflow" }, 500);
  }
});

// Delete workflow (soft delete)
workflows.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const [workflow] = await db
      .update(workflowsTable)
      .set({ deletedAt: new Date() })
      .where(eq(workflowsTable.id, id))
      .returning();

    if (!workflow) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return c.json({ error: "Failed to delete workflow" }, 500);
  }
});

// Enable/disable workflow
workflows.post("/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");

    // Get current workflow
    const [current] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, id))
      .limit(1);

    if (!current) {
      return c.json({ error: "Workflow not found" }, 404);
    }

    // Toggle enabled status
    const [workflow] = await db
      .update(workflowsTable)
      .set({
        enabled: !current.enabled,
        updatedAt: new Date(),
      })
      .where(eq(workflowsTable.id, id))
      .returning();

    return c.json({ workflow });
  } catch (error) {
    console.error("Error toggling workflow:", error);
    return c.json({ error: "Failed to toggle workflow" }, 500);
  }
});

export default workflows;
