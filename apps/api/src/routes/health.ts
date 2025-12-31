import { Hono } from "hono";

const health = new Hono();

health.get("/", async (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

health.get("/ready", async (c) => {
  // TODO: Check database and Redis connectivity
  return c.json({
    database: "ok",
    redis: "ok",
    status: "ready",
  });
});

export default health;
