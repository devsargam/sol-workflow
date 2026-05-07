import { Connection } from "@solana/web3.js";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { SubscriptionManager } from "./lib/subscription-manager";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import { ENV_DEFAULTS, QUEUES, SOLANA, INTERVALS, log, getRedisOptions } from "utils";

const connection = new Connection(process.env.SOLANA_RPC_URL || ENV_DEFAULTS.SOLANA_RPC_URL, {
  wsEndpoint: process.env.SOLANA_WS_URL || ENV_DEFAULTS.SOLANA_WS_URL,
  commitment: SOLANA.COMMITMENT,
});

const { url: redisUrl, options: redisOptions } = getRedisOptions();
console.log(`Connecting to Redis at ${redisUrl} with options:`, redisOptions);
const redis = new Redis(redisUrl, redisOptions);

const workflowQueue = new Queue(QUEUES.WORKFLOW_EVENTS, { connection: redis });

const subscriptionManager = new SubscriptionManager(connection, workflowQueue);

async function start() {
  log.info("🔌 Listener service starting...", { service: "listener" });

  const activeWorkflows = await loadActiveWorkflows();

  log.info(`📋 Found ${activeWorkflows.length} active workflows`, {
    service: "listener",
    count: activeWorkflows.length,
  });

  for (const workflow of activeWorkflows) {
    try {
      await subscriptionManager.subscribe(workflow as any);
      log.info(`✅ Subscribed to events for workflow: ${workflow.id} (${workflow.name})`, {
        service: "listener",
        workflowId: workflow.id,
        workflowName: workflow.name,
      });
    } catch (error) {
      log.error(`❌ Failed to subscribe for workflow ${workflow.id}`, error as Error, {
        service: "listener",
        workflowId: workflow.id,
      });
    }
  }

  log.info("🚀 Listener service ready and monitoring events", { service: "listener" });

  // Monitor connection health
  setInterval(() => {
    const stats = subscriptionManager.getStats();
    log.debug(`📊 Active subscriptions: ${stats.activeSubscriptions}`, {
      service: "listener",
      activeSubscriptions: stats.activeSubscriptions,
      activeTokenListingSubscriptions: stats.activeTokenListingSubscriptions,
      activeTokenListingPollers: stats.activeTokenListingPollers,
      subscribedWorkflows: stats.subscribedWorkflows,
    });
  }, INTERVALS.MONITOR_CONNECTION);

  // Periodically reload workflows (check for new/updated workflows)
  setInterval(async () => {
    log.debug("🔄 Reloading workflows...", { service: "listener" });
    try {
      const workflows = await loadActiveWorkflows();
      await subscriptionManager.reconcile(workflows as any);

      log.debug(`📋 Currently ${workflows.length} active workflows`, {
        service: "listener",
        count: workflows.length,
      });
    } catch (error) {
      log.error("❌ Failed to reload workflows", error as Error, { service: "listener" });
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
    log.error("Error loading workflows from database", error as Error, {
      service: "listener",
    });
    return [];
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  log.info("SIGTERM received, closing listener...", { service: "listener" });
  await subscriptionManager.unsubscribeAll();
  await redis.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  log.info("SIGINT received, closing listener...", { service: "listener" });
  await subscriptionManager.unsubscribeAll();
  await redis.quit();
  process.exit(0);
});

// Start the service
start().catch((error) => {
  log.error("Fatal error", error as Error, { service: "listener" });
  process.exit(1);
});
