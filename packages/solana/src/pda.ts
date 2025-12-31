import { PublicKey } from "@solana/web3.js";

export interface PDAConfig {
  programId: PublicKey;
  seeds: Buffer[];
}

export async function derivePDA(config: PDAConfig): Promise<[PublicKey, number]> {
  const { programId, seeds } = config;

  return await PublicKey.findProgramAddress(seeds, programId);
}

export function createPDASeed(identifier: string): Buffer {
  return Buffer.from(identifier);
}

// Helper to create PDA for a workflow
export async function deriveWorkflowPDA(
  programId: PublicKey,
  workflowId: string
): Promise<[PublicKey, number]> {
  const seeds = [Buffer.from("workflow"), Buffer.from(workflowId)];

  return await derivePDA({ programId, seeds });
}

// Helper to create PDA for execution authority
export async function deriveExecutionAuthorityPDA(
  programId: PublicKey,
  workflowId: string
): Promise<[PublicKey, number]> {
  const seeds = [Buffer.from("authority"), Buffer.from(workflowId)];

  return await derivePDA({ programId, seeds });
}

// Validate if a public key is a PDA
export function isPDA(address: PublicKey): boolean {
  try {
    // PDAs are off the Ed25519 curve, so this will throw for PDAs
    address.toBuffer();
    return !PublicKey.isOnCurve(address.toBuffer());
  } catch {
    return true;
  }
}
