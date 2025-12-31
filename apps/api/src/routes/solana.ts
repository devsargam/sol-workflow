import { Hono } from "hono";
import { getDefaultConnection, getBalance, formatBalance } from "@repo/solana";

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
    const { PublicKey } = await import("@solana/web3.js");
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

export default solana;
