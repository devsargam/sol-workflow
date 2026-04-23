import { Hono } from "hono";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getDefaultConnection, getBalance, formatBalance } from "@repo/solana";
import { authMiddleware, AuthenticatedContext } from "../middleware/auth";

const solana = new Hono();

// Get balance for a wallet address
solana.get("/balance/:address", async (c) => {
  try {
    const address = c.req.param("address");

    // Validate address format
    if (!address || address.length < 32 || address.length > 44) {
      return c.json({ error: "Invalid Solana address" }, 400);
    }

    const connection = getDefaultConnection();
    const balance = await getBalance(connection, address);

    return c.json({
      address: balance.address,
      lamports: balance.lamports,
      sol: balance.sol,
      formatted: formatBalance(balance.lamports),
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return c.json({ error: "Failed to fetch balance" }, 500);
  }
});

// Get account info
solana.get("/account/:address", async (c) => {
  try {
    const address = c.req.param("address");

    if (!address || address.length < 32 || address.length > 44) {
      return c.json({ error: "Invalid Solana address" }, 400);
    }

    const connection = getDefaultConnection();
    const publicKey = new PublicKey(address);

    const accountInfo = await connection.getAccountInfo(publicKey);

    if (!accountInfo) {
      return c.json({ error: "Account not found" }, 404);
    }

    return c.json({
      address: address,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner.toBase58(),
      executable: accountInfo.executable,
      rentEpoch: accountInfo.rentEpoch,
      dataLength: accountInfo.data.length,
    });
  } catch (error) {
    console.error("Error fetching account info:", error);
    return c.json({ error: "Failed to fetch account info" }, 500);
  }
});

// Health check for Solana connection
solana.get("/health", async (c) => {
  try {
    const connection = getDefaultConnection();
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();

    return c.json({
      connected: true,
      slot,
      blockHeight,
      network: process.env.SOLANA_NETWORK || "devnet",
    });
  } catch (error) {
    console.error("Solana health check failed:", error);
    return c.json({ connected: false, error: "Failed to connect to Solana" }, 500);
  }
});

// Devnet airdrop to the authenticated user's wallet
solana.post("/airdrop", authMiddleware, async (c: AuthenticatedContext) => {
  try {
    const walletAddress = c.user?.walletAddress;
    if (!walletAddress) return c.json({ error: "Authentication required" }, 401);
    const connection = getDefaultConnection();
    const publicKey = new PublicKey(walletAddress);
    const sig = await connection.requestAirdrop(publicKey, 0.1 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    return c.json({ signature: sig, sol: 0.1, address: walletAddress });
  } catch (error) {
    console.error("Airdrop failed:", error);
    return c.json({ error: "Airdrop failed — devnet may be rate-limiting" }, 500);
  }
});

// Return the platform wallet public address
solana.get("/platform-wallet", (c) => {
  const raw = process.env.PLATFORM_WALLET_SECRET_KEY;
  if (!raw) {
    return c.json({ address: null, error: "Platform wallet not configured" }, 503);
  }
  try {
    const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
    return c.json({ address: keypair.publicKey.toBase58() });
  } catch {
    return c.json({ address: null, error: "Invalid platform wallet configuration" }, 503);
  }
});

export default solana;
