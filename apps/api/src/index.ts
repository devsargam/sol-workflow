import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import workflowRoutes from "./routes/workflows";
import executionRoutes from "./routes/executions";
import healthRoutes from "./routes/health";
import solanaRoutes from "./routes/solana";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.route("/health", healthRoutes);
app.route("/workflows", workflowRoutes); // Graph-based API
app.route("/executions", executionRoutes);
app.route("/solana", solanaRoutes);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    name: "Sol Workflow API",
    version: "0.1.0",
    status: "running",
  });
});

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
