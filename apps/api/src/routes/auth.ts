import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import {
  consumeWalletChallenge,
  createAuthToken,
  createWalletChallenge,
} from "../lib/auth";
import { db, users } from "@repo/db";
import { log } from "utils";

const auth = new Hono();

const challengeSchema = z.object({
  walletAddress: z.string().min(32).max(64),
});

const verifySchema = z.object({
  walletAddress: z.string().min(32).max(64),
  nonce: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().min(1),
});

auth.post("/challenge", zValidator("json", challengeSchema), async (c) => {
  try {
    const { walletAddress } = c.req.valid("json");
    const challenge = await createWalletChallenge(walletAddress);
    return c.json(challenge, 201);
  } catch (error) {
    log.error("Failed to create wallet challenge", error as Error, { service: "api" });
    return c.json({ error: "Unable to create wallet challenge" }, 500);
  }
});

auth.post("/verify", zValidator("json", verifySchema), async (c) => {
  const { walletAddress, nonce, message, signature } = c.req.valid("json");
  const challenge = await consumeWalletChallenge(nonce);

  if (!challenge) {
    return c.json({ error: "Challenge expired or already used" }, 400);
  }

  if (challenge.walletAddress !== walletAddress || challenge.message !== message) {
    return c.json({ error: "Challenge payload mismatch" }, 400);
  }

  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(signature, "base64");
  } catch {
    return c.json({ error: "Invalid signature encoding" }, 400);
  }

  if (signatureBytes.length !== 64) {
    log.warn("Wallet signature has unexpected size", {
      service: "api",
      walletAddress,
      signatureLength: signatureBytes.length,
    });
    return c.json({ error: "Invalid signature size" }, 400);
  }

  try {
    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey.toBytes());

    if (!verified) {
      return c.json({ error: "Invalid wallet signature" }, 401);
    }

    const token = await createAuthToken(walletAddress);

    await db.insert(users).values({ walletAddress }).onConflictDoNothing();

    return c.json({
      token,
      walletAddress,
    });
  } catch (error) {
    log.error("Wallet signature verification threw", error as Error, { service: "api", walletAddress });
    return c.json({ error: "Unable to verify wallet signature" }, 400);
  }
});

export default auth;
