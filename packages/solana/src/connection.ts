import { SOLANA } from "utils";
import { Connection, ConnectionConfig, Commitment } from "@solana/web3.js";

export interface SolanaConnectionConfig {
  rpcUrl: string;
  wsUrl?: string;
  commitment?: Commitment;
}

export function createConnection(config: SolanaConnectionConfig): Connection {
  const { rpcUrl, wsUrl, commitment = "confirmed" } = config;

  const connectionConfig: ConnectionConfig = {
    commitment,
    wsEndpoint: wsUrl,
  };

  return new Connection(rpcUrl, connectionConfig);
}

export function getDefaultConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || SOLANA.RPC_URLS.DEVNET;
  const wsUrl = process.env.SOLANA_WS_URL;

  return createConnection({ rpcUrl, wsUrl });
}

// Helper to check connection health
export async function checkConnectionHealth(connection: Connection): Promise<boolean> {
  try {
    const slot = await connection.getSlot();
    return slot > 0;
  } catch (error) {
    console.error("Connection health check failed:", error);
    return false;
  }
}
