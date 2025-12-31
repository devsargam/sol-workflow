import Redis from "ioredis";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { db, executions as executionsTable, workflows as workflowsTable } from "@repo/db";
import { eq } from "drizzle-orm";
import { createDiscordClient, getTemplate } from "@repo/discord";

interface WorkflowEventData {
  workflowId: string;
  executionId: string;
  trigger: {
    type: string;
    data: any;
  };
  filter: {
    conditions: any[];
  };
  action: {
    type: string;
    config: any;
  };
  notify: {
    type: string;
    webhookUrl: string;
    template: string;
  };
}

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function processWorkflowEvent(data: WorkflowEventData) {
  const { executionId, workflowId, filter, action, notify } = data;

  console.log(`📥 Processing execution ${executionId} for workflow ${workflowId}`);

  // Step 1: Check idempotency in Redis (fast check)
  const alreadyProcessed = await redis.get(`exec:${executionId}`);
  if (alreadyProcessed) {
    console.log(`⏭️  Execution ${executionId} already processed, skipping`);
    return { status: "skipped", reason: "already_processed" };
  }

  // Step 2: Create execution record in database
  try {
    await db.insert(executionsTable).values({
      executionId,
      workflowId,
      status: "processing",
      triggerData: data.trigger.data,
    });
    console.log(`✅ Created execution record in database`);
  } catch (error: any) {
    // If unique constraint fails, it means another worker processed it
    if (error.code === "23505") {
      console.log(`⏭️  Execution ${executionId} already exists in DB, skipping`);
      return { status: "skipped", reason: "already_processed" };
    }
    throw error;
  }

  // Step 3: Evaluate filter conditions
  const filterPassed = evaluateFilter(filter, data.trigger.data);
  if (!filterPassed) {
    console.log(`🚫 Filter conditions not met for execution ${executionId}`);

    // Update execution status
    await db
      .update(executionsTable)
      .set({
        status: "filtered",
        completedAt: new Date(),
      })
      .where((t) => t.executionId === executionId);

    await redis.setex(`exec:${executionId}`, 86400, "filtered");
    return { status: "filtered" };
  }

  // Step 4: Execute on-chain action
  let txSignature: string | null = null;
  let txError: string | null = null;

  try {
    console.log(`⚡ Executing action: ${action.type}`);
    txSignature = await executeAction(action);
    console.log(`✅ Action executed successfully: ${txSignature}`);
  } catch (error) {
    console.error(`❌ Action execution failed:`, error);
    txError = (error as Error).message;

    // Update execution with error
    await db
      .update(executionsTable)
      .set({
        status: "failed",
        txError,
        completedAt: new Date(),
      })
      .where((t) => t.executionId === executionId);

    await redis.setex(`exec:${executionId}`, 86400, "failed");
    throw error;
  }

  // Step 5: Send Discord notification
  let notificationError: string | null = null;
  try {
    console.log(`📢 Sending Discord notification`);
    await sendNotification(notify, {
      workflowId,
      executionId,
      txSignature,
      status: "success",
      triggerData: data.trigger.data,
    });
    console.log(`✅ Notification sent successfully`);
  } catch (error) {
    console.error(`⚠️  Notification failed (non-fatal):`, error);
    notificationError = (error as Error).message;
    // Don't fail the job if notification fails
  }

  // Step 6: Mark as completed
  await db
    .update(executionsTable)
    .set({
      status: "success",
      txSignature,
      notificationSent: notificationError ? null : new Date(),
      notificationError,
      completedAt: new Date(),
    })
    .where((t) => t.executionId === executionId);

  await redis.setex(`exec:${executionId}`, 86400, "completed");

  console.log(`🎉 Execution ${executionId} completed successfully`);

  return {
    status: "success",
    executionId,
    txSignature,
  };
}

function evaluateFilter(filter: any, triggerData: any): boolean {
  // TODO: Implement proper filter evaluation logic
  // For now, pass all filters
  return true;
}

async function executeAction(action: any): Promise<string> {
  // TODO: Implement actual Solana transaction execution
  // For now, return a mock signature
  console.log("Executing action:", action.type);

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
  );

  // This is a placeholder - actual implementation will be added
  return "mockSignature_" + Date.now();
}

async function sendNotification(notify: any, context: any): Promise<void> {
  console.log("Sending notification:", notify.type);

  if (notify.type === "discord") {
    // Fetch workflow details to get the name
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, context.workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow ${context.workflowId} not found`);
    }

    // Create Discord client and send webhook
    const discordClient = createDiscordClient(notify.webhookUrl);

    // Get the template (default, success, error, minimal, or detailed)
    const templateName = notify.template || "default";
    const embed = getTemplate(templateName, {
      workflowName: workflow.name,
      executionId: context.executionId,
      txSignature: context.txSignature,
      status: context.status,
      triggerType: workflow.triggerType,
      triggerData: context.triggerData,
      error: context.error,
    });

    await discordClient.sendEmbed(embed);
    console.log(`✅ Discord notification sent successfully to ${notify.webhookUrl.substring(0, 50)}...`);
  }
}
