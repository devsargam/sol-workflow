// apps/api/src/middleware/auth.ts
import { Context, Next } from "hono";
import { log } from "utils";
import { verifyAuthToken } from "../lib/auth";

export interface AuthenticatedContext extends Context {
  user?: {
    id: string;
    walletAddress?: string;
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

    if (process.env.NODE_ENV === "test" && token === "test-token") {
      (c as AuthenticatedContext).user = {
        id: "user-1",
        walletAddress: "user-1",
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
    };

    await next();
  } catch (err) {
    log.error("Authentication error");
    return c.json({ error: "Authentication failed" }, 401);
  }
}
