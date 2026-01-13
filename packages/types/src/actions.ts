import { z } from "zod";

// Action types
export const ActionTypeEnum = z.enum([
  "send_sol",
  "send_spl_token",
  "call_program",
  "do_nothing",
  "kalshi_place_order",
]);

export type ActionType = z.infer<typeof ActionTypeEnum>;

// Send SOL Action
export const SendSolActionConfigSchema = z.object({
  fromKeypair: z.string().optional(), // Base58 encoded keypair (or use PDA)
  toAddress: z.string().min(32).max(44),
  amount: z.number().positive(), // Lamports
  usePDA: z.boolean().default(false),
  pdaSeed: z.string().optional(),
});

export type SendSolActionConfig = z.infer<typeof SendSolActionConfigSchema>;

// Send SPL Token Action
export const SendSPLTokenActionConfigSchema = z.object({
  fromKeypair: z.string().optional(),
  fromTokenAccount: z.string().min(32).max(44),
  toTokenAccount: z.string().min(32).max(44),
  tokenMint: z.string().min(32).max(44),
  amount: z.number().positive(), // Token amount (with decimals)
  decimals: z.number().int().min(0).max(9).default(9),
  usePDA: z.boolean().default(false),
  pdaSeed: z.string().optional(),
});

export type SendSPLTokenActionConfig = z.infer<typeof SendSPLTokenActionConfigSchema>;

// Call Program Action
export const CallProgramActionConfigSchema = z.object({
  programId: z.string().min(32).max(44),
  idl: z.record(z.any()).optional(), // Anchor IDL
  instruction: z.string(), // Instruction name
  accounts: z.array(
    z.object({
      name: z.string(),
      address: z.string().min(32).max(44),
      isSigner: z.boolean().default(false),
      isWritable: z.boolean().default(false),
    })
  ),
  args: z.array(z.any()).optional(),
  signerKeypair: z.string().optional(),
  usePDA: z.boolean().default(false),
  pdaSeed: z.string().optional(),
});

export type CallProgramActionConfig = z.infer<typeof CallProgramActionConfigSchema>;

// Do Nothing Action (placeholder/no-op)
export const DoNothingActionConfigSchema = z.object({});

export type DoNothingActionConfig = z.infer<typeof DoNothingActionConfigSchema>;

// Kalshi Place Order Action
export const KalshiPlaceOrderActionConfigSchema = z.object({
  ticker: z.string().min(1, "Market ticker is required"), // Kalshi uses "ticker" not "marketId"
  side: z.enum(["yes", "no"]),
  action: z.enum(["buy", "sell"]).default("buy"), // Required by Kalshi API
  count: z.number().int().positive("Count must be a positive integer"),
  price: z.number().min(1).max(99, "Price must be between 1-99 cents"), // Kalshi API requires 1-99
  type: z.enum(["limit", "market"]).default("limit"), // Order type
  maxCost: z.number().positive().optional(), // Safety limit in dollars
  maxPositionSize: z.number().int().positive().optional(), // Max contracts for this market
});

export type KalshiPlaceOrderActionConfig = z.infer<typeof KalshiPlaceOrderActionConfigSchema>;

// Union schema for all action configs
export const ActionConfigSchema = z.union([
  SendSolActionConfigSchema,
  SendSPLTokenActionConfigSchema,
  CallProgramActionConfigSchema,
  DoNothingActionConfigSchema,
  KalshiPlaceOrderActionConfigSchema,
]);

export type ActionConfig = z.infer<typeof ActionConfigSchema>;

// Complete action schema
export const ActionSchema = z.object({
  type: ActionTypeEnum,
  config: z.record(z.any()), // Generic config, validated based on type
});

export type Action = z.infer<typeof ActionSchema>;
