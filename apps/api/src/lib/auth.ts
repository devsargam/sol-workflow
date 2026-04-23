import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { sign, verify } from "hono/jwt";
import { getRedisOptions } from "utils";

const AUTH_CHALLENGE_PREFIX = "auth:challenge:";
const AUTH_CHALLENGE_TTL_SECONDS = 60 * 5;
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const FALLBACK_AUTH_SECRET = "local-dev-auth-secret-change-me";

type StoredChallenge = {
  walletAddress: string;
  message: string;
};

const inMemoryChallenges = new Map<
  string,
  {
    challenge: StoredChallenge;
    expiresAt: number;
  }
>();

let redis: Redis | null = null;

function getChallengeRedis() {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    return null;
  }

  if (!redis) {
    const { url, options } = getRedisOptions();
    redis = new Redis(url, options);
  }

  return redis;
}

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
  const nonce = randomUUID();
  const message = buildWalletAuthMessage(walletAddress, nonce);
  const challenge = {
    walletAddress,
    message,
  } satisfies StoredChallenge;
  const challengeRedis = getChallengeRedis();

  if (challengeRedis) {
    await challengeRedis.setex(
      `${AUTH_CHALLENGE_PREFIX}${nonce}`,
      AUTH_CHALLENGE_TTL_SECONDS,
      JSON.stringify(challenge)
    );
  } else {
    inMemoryChallenges.set(nonce, {
      challenge,
      expiresAt: Date.now() + AUTH_CHALLENGE_TTL_SECONDS * 1000,
    });
  }

  return {
    nonce,
    message,
    expiresIn: AUTH_CHALLENGE_TTL_SECONDS,
  };
}

export async function consumeWalletChallenge(nonce: string) {
  const challengeRedis = getChallengeRedis();
  const key = `${AUTH_CHALLENGE_PREFIX}${nonce}`;

  if (!challengeRedis) {
    const storedChallenge = inMemoryChallenges.get(nonce);

    if (!storedChallenge) {
      return null;
    }

    inMemoryChallenges.delete(nonce);

    if (storedChallenge.expiresAt <= Date.now()) {
      return null;
    }

    return storedChallenge.challenge;
  }

  const rawChallenge = await challengeRedis.get(key);

  if (!rawChallenge) {
    return null;
  }

  await challengeRedis.del(key);
  return JSON.parse(rawChallenge) as StoredChallenge;
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
