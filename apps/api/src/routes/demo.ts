import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { redis } from "../lib/redis";

const demo = new Hono();

const MAX_EVENTS = 50;

function redisKey(wallet: string) {
  return `demo:events:${wallet}`;
}

// Store a demo event and return confirmation (simulates an automation API call)
demo.post("/event", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const event = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      ...body,
    };

    const wallet = typeof body?.walletAddress === "string" ? body.walletAddress : "unknown";
    const key = redisKey(wallet);
    await redis.lpush(key, JSON.stringify(event));
    await redis.ltrim(key, 0, MAX_EVENTS - 1);
    await redis.expire(key, 60 * 60 * 24); // 24h TTL

    return c.json({ ok: true, event });
  } catch (error) {
    console.error("Demo event error:", error);
    return c.json({ error: "Failed to store event" }, 500);
  }
});

// Retrieve recent demo events for a wallet
demo.get("/events", async (c) => {
  const wallet = c.req.query("wallet");
  if (!wallet) return c.json({ error: "wallet query param required" }, 400);

  try {
    const raw = await redis.lrange(redisKey(wallet), 0, 19);
    const events = raw.map((e) => {
      try {
        return JSON.parse(e);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return c.json({ events });
  } catch (error) {
    return c.json({ events: [] });
  }
});

export default demo;
