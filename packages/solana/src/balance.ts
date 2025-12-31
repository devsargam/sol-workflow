import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface BalanceInfo {
  lamports: number;
  sol: number;
  address: string;
}

/**
 * Get the SOL balance for a wallet address
 */
export async function getBalance(
  connection: Connection,
  address: string | PublicKey
): Promise<BalanceInfo> {
  const publicKey = typeof address === "string" ? new PublicKey(address) : address;

  const lamports = await connection.getBalance(publicKey);

  return {
    lamports,
    sol: lamports / LAMPORTS_PER_SOL,
    address: publicKey.toBase58(),
  };
}

/**
 * Monitor balance changes for a wallet
 */
export async function watchBalance(
  connection: Connection,
  address: string | PublicKey,
  callback: (balance: BalanceInfo) => void,
  intervalMs: number = 5000
): Promise<() => void> {
  const publicKey = typeof address === "string" ? new PublicKey(address) : address;

  let previousBalance: number | null = null;

  const checkBalance = async () => {
    try {
      const balance = await getBalance(connection, publicKey);

      // Only call callback if balance changed
      if (previousBalance !== null && balance.lamports !== previousBalance) {
        console.log(
          `Balance changed: ${previousBalance / LAMPORTS_PER_SOL} SOL → ${balance.sol} SOL`
        );
        callback(balance);
      }

      previousBalance = balance.lamports;
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Initial check
  await checkBalance();

  // Set up interval
  const intervalId = setInterval(checkBalance, intervalMs);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Format balance for display
 */
export function formatBalance(lamports: number, decimals: number = 4): string {
  const sol = lamports / LAMPORTS_PER_SOL;
  return sol.toFixed(decimals);
}

/**
 * Format balance with symbol
 */
export function formatBalanceWithSymbol(lamports: number, decimals: number = 4): string {
  return `${formatBalance(lamports, decimals)} SOL`;
}

/**
 * Check if balance changed by more than threshold
 */
export function hasSignificantChange(
  oldBalance: number,
  newBalance: number,
  thresholdLamports: number = 1000
): boolean {
  return Math.abs(newBalance - oldBalance) >= thresholdLamports;
}
