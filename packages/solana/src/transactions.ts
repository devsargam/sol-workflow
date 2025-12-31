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
  connection: Connection,
  payer: Keypair,
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
  const { feeCalculator } = await connection.getRecentBlockhash();
  return feeCalculator.lamportsPerSignature * transaction.signatures.length;
}
