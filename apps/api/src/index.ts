import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import workflowRoutes from "./routes/workflows";
import executionRoutes from "./routes/executions";
import solanaRoutes from "./routes/solana";
import { ENV_DEFAULTS, API } from "utils";

const app = new Hono();

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

const port = Number(process.env.PORT) || ENV_DEFAULTS.PORT;

console.log(`🚀 API server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
