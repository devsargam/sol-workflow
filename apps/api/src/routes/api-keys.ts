import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { randomBytes, createHash } from "node:crypto";
import { db, apiKeys, eq, and, isNull, desc } from "@repo/db";
import { authMiddleware, AuthenticatedContext } from "../middleware/auth";

const apiKeysRoutes = new Hono();

apiKeysRoutes.use("*", authMiddleware);

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

function generateApiKey(): { key: string; prefix: string; hash: string } {
  // 32 random bytes → 64-char hex string. With "dk_live_" prefix → readable token.
  const random = randomBytes(32).toString("hex");
  const key = `dk_live_${random}`;
  const prefix = `${key.slice(0, 16)}...`;
  const hash = createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

apiKeysRoutes.get("/", async (c: AuthenticatedContext) => {
  const userId = c.user?.id;
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  try {
    const rows = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, userId), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt));

    return c.json({ apiKeys: rows });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return c.json({ error: "Failed to list API keys" }, 500);
  }
});

apiKeysRoutes.post("/", zValidator("json", createSchema), async (c) => {
  const ctx = c as unknown as AuthenticatedContext;
  const userId = ctx.user?.id;
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  try {
    const { name } = c.req.valid("json");
    const { key, prefix, hash } = generateApiKey();

    const [created] = await db
      .insert(apiKeys)
      .values({
        userId,
        name,
        keyHash: hash,
        keyPrefix: prefix,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      });

    if (!created) {
      return c.json({ error: "Failed to create API key" }, 500);
    }

    // Plain key returned ONCE; never stored in cleartext.
    return c.json({ apiKey: created, key }, 201);
  } catch (error) {
    console.error("Error creating API key:", error);
    return c.json({ error: "Failed to create API key" }, 500);
  }
});

apiKeysRoutes.delete("/:id", async (c: AuthenticatedContext) => {
  const userId = c.user?.id;
  const id = c.req.param("id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  try {
    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!existing) return c.json({ error: "API key not found" }, 404);
    if (existing.userId !== userId) return c.json({ error: "Forbidden" }, 403);

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, id));

    return c.json({ success: true });
  } catch (error) {
    console.error("Error revoking API key:", error);
    return c.json({ error: "Failed to revoke API key" }, 500);
  }
});

export default apiKeysRoutes;
