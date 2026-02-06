import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { Queue } from "bullmq";
import Redis from "ioredis";
import workflowRoutes from "./routes/workflows.js";
import executionRoutes from "./routes/executions.js";
import solanaRoutes from "./routes/solana.js";
import { getCronScheduler, initCronScheduler } from "./cron";
import { db, workflows as workflowsTable } from "@repo/db";
import { ENV_DEFAULTS, API, QUEUES } from "utils";

const app = new Hono();

// Initialize Redis and BullMQ Queue for cron scheduling
const redis = new Redis(process.env.REDIS_URL || ENV_DEFAULTS.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const workflowQueue = new Queue(QUEUES.WORKFLOW_EVENTS, { connection: redis });

// Initialize cron scheduler on startup unless explicitly disabled
if (process.env.NODE_ENV !== "test" && process.env.ENABLE_CRON !== "false") {
  void initCronScheduler(workflowQueue);
}

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

// Health check endpoint with comprehensive stats
app.get("/health", async (c) => {
  const health: {
    status: "ok" | "degraded" | "unhealthy";
    timestamp: string;
    services: {
      database: { status: string; latency?: number; error?: string };
      redis: { status: string; latency?: number; error?: string };
      cron: { status: string; activeJobs?: number; error?: string } | null;
    };
    uptime: number;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: { status: "unknown" },
      redis: { status: "unknown" },
      cron: null,
    },
    uptime: process.uptime(),
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await db.select().from(workflowsTable).limit(1);
    health.services.database = {
      status: "healthy",
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.services.database = {
      status: "unhealthy",
      error: (error as Error).message,
    };
    health.status = "degraded";
  }

  // Check Redis connectivity
  try {
    const redisStart = Date.now();
    await redis.ping();
    health.services.redis = {
      status: "healthy",
      latency: Date.now() - redisStart,
    };
  } catch (error) {
    health.services.redis = {
      status: "unhealthy",
      error: (error as Error).message,
    };
    health.status = "degraded";
  }

  // Check cron scheduler
  const cronScheduler = getCronScheduler();
  if (cronScheduler) {
    try {
      const cronStats = await cronScheduler.getStats();
      health.services.cron = {
        status: "healthy",
        activeJobs: cronStats.activeCronJobs,
      };
    } catch (error) {
      health.services.cron = {
        status: "unhealthy",
        error: (error as Error).message,
      };
      health.status = "degraded";
    }
  }

  // If any critical service is down, mark as unhealthy
  if (
    health.services.database.status === "unhealthy" ||
    health.services.redis.status === "unhealthy"
  ) {
    health.status = "unhealthy";
  }

  const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;
  return c.json(health, statusCode);
});

// Readiness check for Kubernetes
app.get("/ready", async (c) => {
  try {
    // Quick check that critical services are available
    await Promise.all([db.select().from(workflowsTable).limit(1), redis.ping()]);
    return c.json({ ready: true });
  } catch {
    return c.json({ ready: false }, 503);
  }
});

// Liveness check for Kubernetes
app.get("/live", (c) => {
  return c.json({ alive: true });
});

const port = Number(process.env.PORT) || ENV_DEFAULTS.PORT;

console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
