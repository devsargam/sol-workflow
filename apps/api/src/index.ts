import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { Queue } from "bullmq";
import Redis from "ioredis";
import workflowRoutes from "./routes/workflows";
import executionRoutes from "./routes/executions";
import solanaRoutes from "./routes/solana";
import { CronScheduler } from "./lib/cron-scheduler";
import { db, workflows as workflowsTable } from "@repo/db";
import { ENV_DEFAULTS, API, QUEUES, log } from "utils";

const app = new Hono();

// Initialize Redis and BullMQ Queue for cron scheduling
const redis = new Redis(process.env.REDIS_URL || ENV_DEFAULTS.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const workflowQueue = new Queue(QUEUES.WORKFLOW_EVENTS, { connection: redis });

// Initialize CronScheduler
let cronScheduler: CronScheduler | null = null;

/**
 * Get the CronScheduler instance (used by routes)
 */
export function getCronScheduler(): CronScheduler | null {
  return cronScheduler;
}

/**
 * Initialize cron scheduler and reconcile with database
 */
async function initializeCronScheduler() {
  try {
    cronScheduler = new CronScheduler(workflowQueue);

    // Load all workflows and reconcile cron jobs
    const allWorkflows = await db.select().from(workflowsTable);

    const workflowsForReconciliation = allWorkflows.map((w) => ({
      id: w.id,
      graph: w.graph as any,
      metadata: w.metadata,
      enabled: w.enabled,
    }));

    const result = await cronScheduler.reconcileAll(workflowsForReconciliation);

    log.info(
      `Cron scheduler initialized: ${result.added} jobs added, ${result.removed} jobs removed`,
      {
        service: "api",
        added: result.added,
        removed: result.removed,
      }
    );
  } catch (error) {
    log.error("Failed to initialize cron scheduler", error as Error, {
      service: "api",
    });
  }
}

// Initialize cron scheduler on startup
initializeCronScheduler();

app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || ENV_DEFAULTS.CORS_ORIGIN,
    credentials: true,
  })
);

app.route(API.ROUTES.WORKFLOWS, workflowRoutes); // Graph-based API
app.route(API.ROUTES.EXECUTIONS, executionRoutes);
app.route(API.ROUTES.SOLANA, solanaRoutes);

// Health check endpoint with cron stats
app.get("/health", async (c) => {
  const cronStats = cronScheduler ? await cronScheduler.getStats() : null;
  return c.json({
    status: "ok",
    cron: cronStats,
  });
});

const port = Number(process.env.PORT) || ENV_DEFAULTS.PORT;

console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
