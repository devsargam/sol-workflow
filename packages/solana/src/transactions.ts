import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export interface SendSolParams {
  connection: Connection;
  fromKeypair: Keypair;
  toAddress: PublicKey;
  lamports: number;
}

export async function sendSol(params: SendSolParams): Promise<string> {
  const { connection, fromKeypair, toAddress, lamports } = params;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toAddress,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair], {
    commitment: "confirmed",
  });

  return signature;
}

export interface SendSPLTokenParams {
  connection: Connection;
  fromKeypair: Keypair;
  fromTokenAccount: PublicKey;
  toTokenAccount: PublicKey;
  amount: number;
}

export async function sendSPLToken(params: SendSPLTokenParams): Promise<string> {
  const { connection, fromKeypair, fromTokenAccount, toTokenAccount, amount } = params;

  const transaction = new Transaction().add(
    createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromKeypair.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [fromKeypair], {
    commitment: "confirmed",
  });

  return signature;
}

export interface CallProgramParams {
  connection: Connection;
  programId: PublicKey;
  instruction: TransactionInstruction;
  signers: Keypair[];
}

export async function callProgram(params: CallProgramParams): Promise<string> {
  const { connection, instruction, signers } = params;

  const transaction = new Transaction().add(instruction);

  const signature = await sendAndConfirmTransaction(connection, transaction, signers, {
    commitment: "confirmed",
  });

  return signature;
}

// Helper to get associated token account
export async function getOrCreateAssociatedTokenAccount(
  _connection: Connection,
  _payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  return await getAssociatedTokenAddress(mint, owner);
}

// Helper to estimate transaction fee
export async function estimateTransactionFee(
  connection: Connection,
  transaction: Transaction
): Promise<number> {
  // Get the latest blockhash to use for fee calculation
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;

  // Use getFeeForMessage for modern fee calculation
  const message = transaction.compileMessage();
  const feeResult = await connection.getFeeForMessage(message);

  if (feeResult.value === null) {
    // Fallback to a reasonable default if fee calculation fails
    return 5000 * transaction.signatures.length;
  }

  return feeResult.value;
}
