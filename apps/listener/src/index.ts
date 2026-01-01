import { Connection } from "@solana/web3.js";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { SubscriptionManager } from "./lib/subscription-manager";
import { db, workflows as workflowsTable } from "@repo/db";
import { eq } from "drizzle-orm";

const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  {
    wsEndpoint: process.env.SOLANA_WS_URL,
    commitment: "confirmed",
  }
);

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const workflowQueue = new Queue("workflow-events", { connection: redis });

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
  }, 60000); // Every minute

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
  }, 30000); // Every 30 seconds
}

async function loadActiveWorkflows() {
  try {
    const workflows = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.enabled, true));

    // Process graph-based workflows
    return workflows.map((w) => {
      const graph = w.graph as any;

      // Extract trigger nodes from the graph
      const triggerNode = graph?.nodes?.find((n: any) => n.type === 'trigger');

      return {
        id: w.id,
        name: w.name,
        graph: graph,
        metadata: w.metadata,
        // Legacy format for backward compatibility with SubscriptionManager
        // TODO: Update SubscriptionManager to work with graph directly
        trigger: triggerNode ? {
          type: triggerNode.data?.triggerType,
          config: triggerNode.data?.config,
        } : null,
      };
    }).filter(w => w.trigger); // Only return workflows with valid triggers
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
