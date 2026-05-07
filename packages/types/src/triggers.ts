import { z } from "zod";

// Trigger types
export const TriggerTypeEnum = z.enum([
  "balance_change",
  "token_receipt",
  "nft_receipt",
  "transaction_status",
  "program_log",
  "new_token_listing",
  "cron",
  "webhook",
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

// New Token Listing Trigger
export const NewTokenListingTriggerConfigSchema = z.object({
  source: z.literal("birdeye"),
  includeMemePlatforms: z.boolean().default(false),
  minLiquidityUsd: z.number().nonnegative().optional(),
  minVolume24hUsd: z.number().nonnegative().optional(),
  limit: z.number().int().min(1).max(20).default(10),
  pollIntervalSeconds: z.number().int().min(30).max(3600).optional(),
});

export type NewTokenListingTriggerConfig = z.infer<
  typeof NewTokenListingTriggerConfigSchema
>;

// Cron Trigger (time-based scheduling)
export const CronTriggerConfigSchema = z.object({
  schedule: z.string().min(9).max(100), // Cron expression like "*/5 * * * *"
  timezone: z.string().default("UTC"),
});

export type CronTriggerConfig = z.infer<typeof CronTriggerConfigSchema>;

// Webhook Trigger (HTTP endpoint)
export const WebhookTriggerConfigSchema = z.object({
  webhookId: z.string().min(1),
  authEnabled: z.boolean().default(false),
  authHeaderName: z.string().min(1).optional(),
  authHeaderValue: z.string().min(1).optional(),
});

export type WebhookTriggerConfig = z.infer<typeof WebhookTriggerConfigSchema>;

// Union schema for all trigger configs
export const TriggerConfigSchema = z.union([
  BalanceChangeTriggerConfigSchema,
  TokenReceiptTriggerConfigSchema,
  NFTReceiptTriggerConfigSchema,
  TransactionStatusTriggerConfigSchema,
  ProgramLogTriggerConfigSchema,
  NewTokenListingTriggerConfigSchema,
  CronTriggerConfigSchema,
  WebhookTriggerConfigSchema,
]);

export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;

// Complete trigger schema
export const TriggerSchema = z.object({
  type: TriggerTypeEnum,
  config: z.record(z.any()), // Generic config, validated based on type
});

export type Trigger = z.infer<typeof TriggerSchema>;
