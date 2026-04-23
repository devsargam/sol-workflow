import { randomUUID } from "node:crypto";
import { sign, verify } from "hono/jwt";
import { log } from "utils";

const AUTH_CHALLENGE_TTL_SECONDS = 60 * 5;
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const FALLBACK_AUTH_SECRET = "local-dev-auth-secret-change-me";
const AUTH_CHALLENGE_TYPE = "wallet-auth-challenge";

type StoredChallenge = {
  walletAddress: string;
  message: string;
};

export function getAuthSecret() {
  return process.env.AUTH_SECRET?.trim() || FALLBACK_AUTH_SECRET;
}

export function buildWalletAuthMessage(walletAddress: string, nonce: string) {
  return [
    "Sign in to SOL Workflow",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    "",
    "This request will not trigger a blockchain transaction.",
  ].join("\n");
}

export async function createWalletChallenge(walletAddress: string) {
  const now = Math.floor(Date.now() / 1000);
  const nonce = await sign(
    {
      type: AUTH_CHALLENGE_TYPE,
      sub: walletAddress,
      walletAddress,
      nonceId: randomUUID(),
      iat: now,
      exp: now + AUTH_CHALLENGE_TTL_SECONDS,
    },
    getAuthSecret()
  );
  const message = buildWalletAuthMessage(walletAddress, nonce);

  return {
    nonce,
    message,
    expiresIn: AUTH_CHALLENGE_TTL_SECONDS,
  };
}

export async function consumeWalletChallenge(nonce: string) {
  try {
    const payload = await verify(nonce, getAuthSecret());

    if ((payload as Record<string, unknown>)?.type !== AUTH_CHALLENGE_TYPE) {
      return null;
    }

    const walletAddress =
      typeof (payload as Record<string, unknown>)?.walletAddress === "string"
        ? ((payload as Record<string, unknown>).walletAddress as string)
        : typeof (payload as Record<string, unknown>)?.sub === "string"
          ? ((payload as Record<string, unknown>).sub as string)
          : null;

    if (!walletAddress) {
      return null;
    }

    return {
      walletAddress,
      message: buildWalletAuthMessage(walletAddress, nonce),
    } satisfies StoredChallenge;
  } catch (error) {
    log.warn("Wallet challenge verification failed", {
      service: "api",
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function createAuthToken(walletAddress: string) {
  const now = Math.floor(Date.now() / 1000);

  return sign(
    {
      sub: walletAddress,
      walletAddress,
      iat: now,
      exp: now + AUTH_TOKEN_TTL_SECONDS,
    },
    getAuthSecret()
  );
}

export async function verifyAuthToken(token: string) {
  return verify(token, getAuthSecret());
}
