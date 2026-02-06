/**
 * Shared constants used throughout the Sol-Workflow application
 */

// ============================================================================
// Queue and Event Constants
// ============================================================================

export const QUEUES = {
  WORKFLOW_EVENTS: "workflow-events",
} as const;

export const JOB_NAMES = {
  WORKFLOW_EVENT: "workflow-event",
  CRON_TRIGGER: "cron-trigger",
} as const;

// ============================================================================
// Redis Constants
// ============================================================================

const REDIS_DEFAULT_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const REDIS = {
  DEFAULT_URL: REDIS_DEFAULT_URL,
  KEYS: {
    EXECUTION_PREFIX: "exec:",
  },
  TTL: {
    EXECUTION_CACHE: 86400, // 24 hours in seconds
  },
  VALUES: {
    COMPLETED: "completed",
  },
} as const;

// ============================================================================
// Execution Status Constants
// ============================================================================

export enum ExecutionStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  FILTERED = "filtered",
  SKIPPED = "skipped",
}

// ============================================================================
// API and Server Constants
// ============================================================================

const API_DEFAULT_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const API = {
  DEFAULT_URL: API_DEFAULT_URL,
  DEFAULT_PORT: 3001,
  CORS: {
    DEFAULT_ORIGIN: "http://localhost:3000",
  },
  ROUTES: {
    WORKFLOWS: "/workflows",
    EXECUTIONS: "/executions",
    SOLANA: "/solana",
  },
} as const;

export const FRONTEND = {
  DEFAULT_URL: "http://localhost:3000",
  DEFAULT_PORT: 3000,
} as const;

// ============================================================================
// Environment Variable Defaults
// ============================================================================

export const ENV_DEFAULTS = {
  // Solana
  SOLANA_RPC_URL: "https://api.devnet.solana.com",
  SOLANA_WS_URL: "wss://api.devnet.solana.com",
  SOLANA_NETWORK: "devnet",

  // Redis
  REDIS_URL: REDIS.DEFAULT_URL,

  // API
  PORT: API.DEFAULT_PORT,
  CORS_ORIGIN: API.CORS.DEFAULT_ORIGIN,
  NEXT_PUBLIC_API_URL: API.DEFAULT_URL,
  NEXT_PUBLIC_SOLANA_RPC_URL: "https://api.devnet.solana.com",
  NEXT_PUBLIC_SOLANA_NETWORK: "devnet",

  // Worker
  WORKER_CONCURRENCY: 5,
  RATE_LIMIT_MAX: 10,
  RATE_LIMIT_DURATION: 1000,
} as const;

// ============================================================================
// Timing Constants (in milliseconds)
// ============================================================================

export const INTERVALS = {
  MONITOR_CONNECTION: 60000, // 1 minute
  RELOAD_WORKFLOWS: 30000, // 30 seconds
  REFETCH_EXECUTIONS: 5000, // 5 seconds
  REFETCH_BALANCE: 10000, // 10 seconds
} as const;

// ============================================================================
// BullMQ Job Options
// ============================================================================

export const JOB_OPTIONS = {
  DEFAULT: {
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 1000,
    },
  },
  RATE_LIMIT: {
    max: 10,
    duration: 1000, // 1 second
  },
} as const;

// ============================================================================
// Solana Constants
// ============================================================================

export const SOLANA = {
  COMMITMENT: "confirmed" as const,
  NETWORKS: {
    MAINNET: "mainnet-beta",
    DEVNET: "devnet",
    TESTNET: "testnet",
  },
  RPC_URLS: {
    MAINNET: "https://api.mainnet-beta.solana.com",
    DEVNET: "https://api.devnet.solana.com",
    TESTNET: "https://api.testnet.solana.com",
  },
  EXPLORERS: {
    SOLSCAN: {
      BASE_URL: "https://solscan.io",
      TX_PATH: "/tx/",
    },
  },
} as const;

// ============================================================================
// Trigger Types
// ============================================================================

export enum TriggerType {
  BALANCE_CHANGE = "balance_change",
  TOKEN_RECEIPT = "token_receipt",
  NFT_RECEIPT = "nft_receipt",
  TRANSACTION_STATUS = "transaction_status",
  PROGRAM_LOG = "program_log",
  CRON = "cron",
}

// ============================================================================
// Cron Constants
// ============================================================================

export const CRON = {
  MIN_INTERVAL_SECONDS: 60, // 1 minute minimum to prevent abuse
  COMMON_TIMEZONES: [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Dubai",
    "Australia/Sydney",
    "Pacific/Auckland",
  ],
  PRESETS: {
    EVERY_MINUTE: "* * * * *",
    EVERY_5_MINUTES: "*/5 * * * *",
    EVERY_15_MINUTES: "*/15 * * * *",
    EVERY_30_MINUTES: "*/30 * * * *",
    EVERY_HOUR: "0 * * * *",
    EVERY_DAY_MIDNIGHT: "0 0 * * *",
    EVERY_DAY_9AM: "0 9 * * *",
    EVERY_WEEK_MONDAY: "0 0 * * 1",
  },
} as const;

// ============================================================================
// Node Types
// ============================================================================

export enum NodeType {
  TRIGGER = "trigger",
  FILTER = "filter",
  ACTION = "action",
  NOTIFY = "notify",
}

// ============================================================================
// Workflow Metadata Constants
// ============================================================================

export const WORKFLOW_METADATA = {
  VERSION: "1.0.0",
  LIMITS: {
    MAX_SOL_PER_TX: 1000000, // 0.001 SOL in lamports
    MAX_EXECUTIONS_PER_HOUR: 10,
  },
  CREATED_WITH: {
    API: "api",
    VISUAL_BUILDER: "visual-builder",
  },
} as const;

// ============================================================================
// Database Constants
// ============================================================================

export const DATABASE = {
  ERROR_CODES: {
    UNIQUE_CONSTRAINT_VIOLATION: "23505",
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the Solscan URL for a transaction
 */
export function getSolscanTxUrl(
  txSignature: string,
  network: string = SOLANA.NETWORKS.DEVNET
): string {
  const cluster = network === SOLANA.NETWORKS.MAINNET ? "" : `?cluster=${network}`;
  return `${SOLANA.EXPLORERS.SOLSCAN.BASE_URL}${SOLANA.EXPLORERS.SOLSCAN.TX_PATH}${txSignature}${cluster}`;
}

/**
 * Get the Redis key for an execution
 */
export function getExecutionRedisKey(executionId: string): string {
  return `${REDIS.KEYS.EXECUTION_PREFIX}${executionId}`;
}

/**
 * Generate a unique execution ID using SHA256 hash
 * @param workflowId - The workflow ID
 * @param timestamp - A timestamp or slot number for uniqueness
 * @param identifier - Additional identifier (e.g., trigger node ID, address)
 */
export function generateExecutionId(
  workflowId: string,
  timestamp: number | string,
  identifier: string
): string {
  // Using dynamic import pattern for crypto to work in both Node and browser
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256");
  hash.update(`${workflowId}:${timestamp}:${identifier}`);
  return hash.digest("hex");
}

/**
 * Check if a status indicates completion
 */
export function isCompletedStatus(status: ExecutionStatus): boolean {
  return [
    ExecutionStatus.SUCCESS,
    ExecutionStatus.FAILED,
    ExecutionStatus.FILTERED,
    ExecutionStatus.SKIPPED,
  ].includes(status);
}

/**
 * Check if a status indicates an error
 */
export function isErrorStatus(status: ExecutionStatus): boolean {
  return status === ExecutionStatus.FAILED;
}

// ============================================================================
// Type Exports
// ============================================================================

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];
export type SolanaNetwork = (typeof SOLANA.NETWORKS)[keyof typeof SOLANA.NETWORKS];
export type CreatedWithType =
  (typeof WORKFLOW_METADATA.CREATED_WITH)[keyof typeof WORKFLOW_METADATA.CREATED_WITH];
