// apps/api/src/middleware/auth.ts
import { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { log } from "utils";
import { and, apiKeys, db, eq, isNull } from "@repo/db";
import { verifyAuthToken } from "../lib/auth";

export interface AuthenticatedContext extends Context {
  user?: {
    id: string;
    walletAddress?: string;
    authMethod?: "wallet" | "api_key";
    apiKeyId?: string;
  };
}

async function authenticateApiKey(token: string): Promise<AuthenticatedContext["user"] | null> {
  if (!token.startsWith("dk_live_")) {
    return null;
  }

  const keyHash = createHash("sha256").update(token).digest("hex");

  const [apiKey] = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!apiKey) {
    return null;
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));

  return {
    id: apiKey.userId,
    walletAddress: apiKey.userId,
    authMethod: "api_key",
    apiKeyId: apiKey.id,
  };
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      log.warn("Authentication failed: missing token", { service: "api" });
      return c.json({ error: "Authentication required" }, 401);
    }

    const token = authHeader.substring(7);

    const apiKeyUser = await authenticateApiKey(token);
    if (apiKeyUser) {
      (c as AuthenticatedContext).user = apiKeyUser;
      await next();
      return;
    }

    if (process.env.NODE_ENV === "test" && token === "test-token") {
      (c as AuthenticatedContext).user = {
        id: "user-1",
        walletAddress: "user-1",
        authMethod: "wallet",
      };
      await next();
      return;
    }

    const payload = await verifyAuthToken(token).catch(() => null);

    if (!payload) {
      log.warn("Authentication failed: invalid token", { service: "api" });
      return c.json({ error: "Invalid token" }, 401);
    }

    const walletAddress =
      typeof (payload as any)?.walletAddress === "string"
        ? (payload as any).walletAddress
        : typeof (payload as any)?.sub === "string"
          ? (payload as any).sub
          : undefined;

    if (!walletAddress) {
      log.warn("Authentication failed: missing wallet address", { service: "api" });
      return c.json({ error: "Wallet address required" }, 401);
    }

    (c as AuthenticatedContext).user = {
      id: walletAddress,
      walletAddress,
      authMethod: "wallet",
    };

    await next();
  } catch (err) {
    log.error("Authentication error");
    return c.json({ error: "Authentication failed" }, 401);
  }
}
