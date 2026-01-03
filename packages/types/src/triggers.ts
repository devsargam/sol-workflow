import { z } from "zod";

// Trigger types
export const TriggerTypeEnum = z.enum([
  "balance_change",
  "token_receipt",
  "nft_receipt",
  "transaction_status",
  "program_log",
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;

// Balance Change Trigger
export const BalanceChangeTriggerConfigSchema = z.object({
  address: z.string().min(32).max(44), // Solana public key
  minChange: z.number().optional(), // Minimum lamports change to trigger
  changeType: z.enum(["increase", "decrease", "any"]).default("any"),
});

export type BalanceChangeTriggerConfig = z.infer<typeof BalanceChangeTriggerConfigSchema>;

// Token Receipt Trigger
export const TokenReceiptTriggerConfigSchema = z.object({
  tokenAccount: z.string().min(32).max(44), // Token account address
  tokenMint: z.string().min(32).max(44).optional(), // Token mint address
  minAmount: z.number().optional(), // Minimum token amount to trigger
});

export type TokenReceiptTriggerConfig = z.infer<typeof TokenReceiptTriggerConfigSchema>;

// NFT Receipt Trigger
export const NFTReceiptTriggerConfigSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  collectionAddress: z.string().min(32).max(44).optional(), // Filter by collection
  verifiedOnly: z.boolean().default(true),
});

export type NFTReceiptTriggerConfig = z.infer<typeof NFTReceiptTriggerConfigSchema>;

// Transaction Status Trigger
export const TransactionStatusTriggerConfigSchema = z.object({
  signature: z.string().optional(),
  programId: z.string().min(32).max(44).optional(),
  accountInvolved: z.string().min(32).max(44).optional(),
  statusType: z.enum(["success", "failure", "any"]).default("any"),
});

export type TransactionStatusTriggerConfig = z.infer<typeof TransactionStatusTriggerConfigSchema>;

// Program Log Trigger
export const ProgramLogTriggerConfigSchema = z.object({
  programId: z.string().min(32).max(44),
  logPattern: z.string().optional(), // Regex pattern to match in logs
  mentionedAccounts: z.array(z.string()).optional(),
});

export type ProgramLogTriggerConfig = z.infer<typeof ProgramLogTriggerConfigSchema>;

// Union schema for all trigger configs
export const TriggerConfigSchema = z.union([
  BalanceChangeTriggerConfigSchema,
  TokenReceiptTriggerConfigSchema,
  NFTReceiptTriggerConfigSchema,
  TransactionStatusTriggerConfigSchema,
  ProgramLogTriggerConfigSchema,
]);

export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

// Complete trigger schema
export const TriggerSchema = z.object({
  type: TriggerTypeEnum,
  config: z.record(z.any()), // Generic config, validated based on type
});

export type Trigger = z.infer<typeof TriggerSchema>;
