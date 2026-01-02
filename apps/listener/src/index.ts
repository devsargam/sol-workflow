import { Connection } from "@solana/web3.js";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { SubscriptionManager } from "./lib/subscription-manager";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import { ENV_DEFAULTS, QUEUES, SOLANA, INTERVALS } from "utils";

const connection = new Connection(process.env.SOLANA_RPC_URL || ENV_DEFAULTS.SOLANA_RPC_URL, {
  wsEndpoint: process.env.SOLANA_WS_URL || ENV_DEFAULTS.SOLANA_WS_URL,
  commitment: SOLANA.COMMITMENT,
});

const redis = new Redis(process.env.REDIS_URL || ENV_DEFAULTS.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const workflowQueue = new Queue(QUEUES.WORKFLOW_EVENTS, { connection: redis });

const subscriptionManager = new SubscriptionManager(connection, workflowQueue);

async function start() {
  console.log("🔌 Listener service starting...");

  // Load active workflows from database
  const activeWorkflows = await loadActiveWorkflows();

  console.log(`📋 Found ${activeWorkflows.length} active workflows`);

  // Subscribe to Solana events for each workflow
  for (const workflow of activeWorkflows) {
    try {
      await subscriptionManager.subscribe(workflow);
      console.log(`✅ Subscribed to events for workflow: ${workflow.id} (${workflow.name})`);
    } catch (error) {
      console.error(`❌ Failed to subscribe for workflow ${workflow.id}:`, error);
    }
  }

  console.log("🚀 Listener service ready and monitoring events");

  // Monitor connection health
  setInterval(() => {
    const stats = subscriptionManager.getStats();
    console.log(`📊 Active subscriptions: ${stats.activeSubscriptions}`);
  }, INTERVALS.MONITOR_CONNECTION);

  // Periodically reload workflows (check for new/updated workflows)
  setInterval(async () => {
    console.log("🔄 Reloading workflows...");
    try {
      const workflows = await loadActiveWorkflows();

      // TODO: Handle dynamic subscription updates
      // For now, just log the count
      console.log(`📋 Currently ${workflows.length} active workflows`);
    } catch (error) {
      console.error("❌ Failed to reload workflows:", error);
    }
  }, INTERVALS.RELOAD_WORKFLOWS);
}

async function loadActiveWorkflows() {
  try {
    const workflows = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.enabled, true));

    // Return graph-based workflows
    return workflows;
  } catch (error) {
    console.error("Error loading workflows from database:", error);
    return [];
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing listener...");
  await subscriptionManager.unsubscribeAll();
  await redis.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing listener...");
  await subscriptionManager.unsubscribeAll();
  await redis.quit();
  process.exit(0);
});

// Start the service
start().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
