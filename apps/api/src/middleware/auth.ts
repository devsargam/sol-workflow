// apps/api/src/middleware/auth.ts
import { Context, Next } from "hono";
import { privy } from "../utils/privyClient";
import { log } from "utils";

export interface AuthenticatedContext extends Context {
  user?: {
    id: string;
    email: string;
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

    const resp = await privy.utils().auth().verifyAuthToken(token);

    if (!resp) {
      log.warn("Authentication failed: invalid token", { service: "api" });
      return c.json({ error: "Invalid token" }, 401);
    }

    log.debug("Token verification response", {
      service: "api",
      respType: typeof resp,
      respKeys: resp ? Object.keys(resp as any) : [],
      hasUserId: !!(resp as any)?.userId,
      hasSub: !!(resp as any)?.sub,
      hasId: !!(resp as any)?.id,
    });

    // Extract userId from various possible fields
    const userId =
      (resp as any)?.sub || (resp as any)?.userId || (resp as any)?.id || (resp as any)?.user_id;

    if (!userId) {
      log.warn("Authentication failed: missing userId", {
        service: "api",
        respKeys: resp ? Object.keys(resp as any) : [],
        respSample: resp ? JSON.stringify(resp).substring(0, 200) : null,
      });
      return c.json({ error: "User ID required" }, 401);
    }

    log.debug("Extracted userId from token", { service: "api", userId });

    // Get user details from Privy
    const privyUser = await privy.users()._get(userId);

    // Find email from linked accounts
    const email = privyUser.linked_accounts.find((a) => a.type === "email")?.address;
    if (!email) {
      log.warn("Authentication failed: no email linked", {
        service: "api",
        userId,
      });
      return c.json({ error: "User has no email linked" }, 400);
    }

    // Attach user info to context
    (c as AuthenticatedContext).user = {
      id: userId,
      email,
    };

    log.debug("User authenticated", {
      service: "api",
      userId,
      email,
    });

    await next();
  } catch (err) {
    log.error("Authentication error");
    return c.json({ error: "Authentication failed" }, 401);
  }
}
