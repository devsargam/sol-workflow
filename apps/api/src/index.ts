import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { Queue } from "bullmq";
import Redis from "ioredis";
import workflowRoutes from "./routes/workflows";
import executionRoutes from "./routes/executions";
import solanaRoutes from "./routes/solana";
import authRoutes from "./routes/auth";
import { getCronScheduler, initCronScheduler } from "./cron";
import { db, workflows as workflowsTable } from "@repo/db";
import { ENV_DEFAULTS, API, QUEUES, getRedisOptions } from "utils";

const app = new Hono();

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, "");
}

const allowedCorsOrigins = (
  process.env.CORS_ORIGIN?.split(",") ?? [ENV_DEFAULTS.CORS_ORIGIN]
)
  .map(normalizeOrigin)
  .filter(Boolean);

function resolveCorsOrigin(requestOrigin?: string) {
  if (!requestOrigin) {
    return undefined;
  }

  const normalizedRequestOrigin = normalizeOrigin(requestOrigin);

  if (allowedCorsOrigins.includes(normalizedRequestOrigin)) {
    return requestOrigin;
  }

  return undefined;
}

// Initialize Redis and BullMQ Queue for cron scheduling
const { url: redisUrl, options: redisOptions } = getRedisOptions();
const redis = new Redis(redisUrl, redisOptions);

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
    origin: resolveCorsOrigin,
    credentials: true,
  })
);

app.route(API.ROUTES.AUTH, authRoutes);
app.route(`/api${API.ROUTES.AUTH}`, authRoutes);
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

const server = {
  port,
  fetch: app.fetch,
};

const isMainModule =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  serve(server);
  console.log(`🚀 API server running on http://localhost:${port}`);
}

export default server;
