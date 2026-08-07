import { z } from "zod";

// Node position in the React Flow canvas
export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Base node structure that all node types extend
export const BaseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: NodePositionSchema,
});

// Trigger node data schema
export const TriggerNodeDataSchema = z.object({
  triggerType: z.enum([
    "balance_change",
    "token_receipt",
    "nft_receipt",
    "transaction_status",
    "program_log",
    "new_token_listing",
    "cron",
    "webhook",
    "x402_payment",
  ]),
  config: z.object({
    inputFormat: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1),
          type: z.enum(["string", "number", "boolean", "object"]),
          description: z.string().optional(),
          value: z.string().optional(),
        })
      )
      .optional(),
    // Common fields
    address: z.string().optional(),

    // Balance change specific
    minChange: z.number().optional(),
    changeType: z.enum(["increase", "decrease", "any"]).optional(),

    // Token receipt specific
    tokenAccount: z.string().optional(),
    tokenMint: z.string().optional(),
    minAmount: z.number().optional(),

    // NFT receipt specific
    walletAddress: z.string().optional(),
    collectionAddress: z.string().optional(),
    verifiedOnly: z.boolean().optional(),

    // Transaction status specific
    signature: z.string().optional(),
    programId: z.string().optional(),
    accountInvolved: z.string().optional(),
    statusType: z.enum(["success", "failed", "any"]).optional(),

    // Program log specific
    logPattern: z.string().optional(),
    mentionedAccounts: z.array(z.string()).optional(),

    // New token listing specific
    source: z.enum(["birdeye"]).optional(),
    includeMemePlatforms: z.boolean().optional(),
    minLiquidityUsd: z.number().nonnegative().optional(),
    minVolume24hUsd: z.number().nonnegative().optional(),
    limit: z.number().int().min(1).max(20).optional(),
    pollIntervalSeconds: z.number().int().min(30).max(3600).optional(),

    // Cron trigger specific
    schedule: z.string().optional(), // Cron expression like "*/5 * * * *"
    timezone: z.string().optional(), // Timezone like "UTC" or "America/New_York"

    // Webhook trigger specific
    webhookId: z.string().optional(),
    authEnabled: z.boolean().optional(),
    authHeaderName: z.string().optional(),
    authHeaderValue: z.string().optional(),

    // x402 paid webhook trigger specific
    payTo: z.string().optional(),
    price: z.string().optional(),
    network: z.string().optional(),
    description: z.string().optional(),
  }),
});

// Filter node data schema
export const FilterNodeDataSchema = z.object({
  label: z.string().optional(),
  preset: z.enum(["copy_wallet"]).optional(),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "equals",
        "==",
        "not_equals",
        "!=",
        "greater_than",
        ">",
        "greater_than_or_equal",
        ">=",
        "less_than",
        "<",
        "less_than_or_equal",
        "<=",
        "contains",
        "starts_with",
        "ends_with",
      ]),
      value: z.any(),
    })
  ),
  logic: z.enum(["and", "or"]).default("and"),
});

// Action node data schema
export const ActionNodeDataSchema = z.object({
  actionType: z.enum(["send_sol", "send_spl_token", "call_program", "do_nothing"]),
  config: z.object({
    // Send SOL specific
    fromKeypair: z.string().optional(),
    toAddress: z.string().optional(),
    amount: z.number().optional(), // in lamports

    // Send SPL Token specific
    fromTokenAccount: z.string().optional(),
    toTokenAccount: z.string().optional(),
    tokenMint: z.string().optional(),
    decimals: z.number().optional(),

    // Call program specific
    programId: z.string().optional(),
    idl: z.any().optional(),
    instruction: z.string().optional(),
    accounts: z.array(z.any()).optional(),
    args: z.any().optional(),
    signerKeypair: z.string().optional(),

    // PDA support
    usePDA: z.boolean().optional(),
    pdaSeed: z.string().optional(),
  }),
});

export const SingleNotificationConfigSchema = z
  .object({
    notifyType: z.enum(["discord", "telegram", "email", "webhook"]),
    webhookUrl: z.string().optional(),
    webhookSecret: z.string().optional(),
    telegramBotToken: z.string().min(1).optional(),
    telegramChatId: z.string().min(1).optional(),
    telegramParseMode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
    telegramDisableWebPreview: z.boolean().optional(),
    template: z.enum(["default", "success", "error", "minimal", "detailed"]).default("default"),
    customMessage: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.notifyType === "discord" || data.notifyType === "webhook") && !data.webhookUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookUrl"],
        message: "webhookUrl is required for discord/webhook notifications",
      });
    }

    if (data.notifyType === "webhook" && !data.webhookSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookSecret"],
        message: "webhookSecret is required for webhook notifications",
      });
    }

    if (data.notifyType === "telegram") {
      return;
    }
  });

export const NotifyNodeDataSchema = z
  .object({
    notifyType: z.enum(["discord", "telegram", "email", "webhook"]).optional(),
    webhookUrl: z.string().optional(),
    webhookSecret: z.string().optional(),
    telegramBotToken: z.string().min(1).optional(),
    telegramChatId: z.string().min(1).optional(),
    telegramParseMode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
    telegramDisableWebPreview: z.boolean().optional(),
    template: z.enum(["default", "success", "error", "minimal", "detailed"]).optional(),
    customMessage: z.string().optional(),

    notifications: z.array(SingleNotificationConfigSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.notifications && data.notifications.length > 0) {
      data.notifications.forEach((notification, index) => {
        if (
          (notification.notifyType === "discord" || notification.notifyType === "webhook") &&
          !notification.webhookUrl
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["notifications", index, "webhookUrl"],
            message: "webhookUrl is required for discord/webhook notifications",
          });
        }

        if (notification.notifyType === "webhook" && !notification.webhookSecret) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["notifications", index, "webhookSecret"],
            message: "webhookSecret is required for webhook notifications",
          });
        }

        if (notification.notifyType === "telegram") {
          return;
        }
      });
    } else if (data.notifyType) {
      if ((data.notifyType === "discord" || data.notifyType === "webhook") && !data.webhookUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["webhookUrl"],
          message: "webhookUrl is required for discord/webhook notifications",
        });
      }

      if (data.notifyType === "webhook" && !data.webhookSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["webhookSecret"],
          message: "webhookSecret is required for webhook notifications",
        });
      }

      if (data.notifyType === "telegram") {
        return;
      }
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notifyType"],
        message: "Either notifyType or notifications array must be provided",
      });
    }
  });

// Fallthrough for any node type registered outside the four well-known kinds.
// Validates structure but doesn't constrain the data shape — that's the
// node manifest's job at execution time.
export const CustomNodeDataSchema = z
  .object({
    nodeType: z.string().min(1),
  })
  .passthrough();

// Union of all node data types. The strict variants are tried first so known
// types still get full validation; unknown types fall through to the open shape.
export const NodeDataSchema = z.union([
  z.object({ nodeType: z.literal("trigger"), ...TriggerNodeDataSchema.shape }),
  z.object({ nodeType: z.literal("filter"), ...FilterNodeDataSchema.shape }),
  z.object({ nodeType: z.literal("action"), ...ActionNodeDataSchema.shape }),
  z.object({ nodeType: z.literal("notify") }).and(NotifyNodeDataSchema),
  CustomNodeDataSchema,
]);

// Complete node schema
export const WorkflowNodeSchema = BaseNodeSchema.extend({
  data: NodeDataSchema,
  selected: z.boolean().optional(),
  dragging: z.boolean().optional(),
});

// Edge schema (connection between nodes)
export const WorkflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(), // Source node ID
  target: z.string(), // Target node ID
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.enum(["default", "smoothstep", "straight", "step"]).optional(),
  animated: z.boolean().optional(),
  style: z.record(z.any()).optional(),
  data: z.any().optional(),
});

// Complete workflow graph schema
export const WorkflowGraphSchema = z.object({
  nodes: z.array(WorkflowNodeSchema),
  edges: z.array(WorkflowEdgeSchema),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
});

// Workflow metadata schema
export const WorkflowMetadataSchema = z.object({
  version: z.string().default("1.0.0"),
  maxSolPerTx: z.number().default(1000000), // in lamports
  maxExecutionsPerHour: z.number().default(10),
  createdWith: z.string().optional(), // e.g., "visual-builder", "api"
  lastModifiedWith: z.string().optional(),
});

// Complete workflow schema (for database storage)
export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  graph: WorkflowGraphSchema,
  metadata: WorkflowMetadataSchema,
  enabled: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

// Types exported from schemas
export type NodePosition = z.infer<typeof NodePositionSchema>;
export type TriggerNodeData = z.infer<typeof TriggerNodeDataSchema>;
export type FilterNodeData = z.infer<typeof FilterNodeDataSchema>;
export type ActionNodeData = z.infer<typeof ActionNodeDataSchema>;
export type NotifyNodeData = z.infer<typeof NotifyNodeDataSchema>;
export type NodeData = z.infer<typeof NodeDataSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof WorkflowEdgeSchema>;
export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;
export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

// Helper function to validate a workflow graph
export function validateWorkflowGraph(graph: unknown): WorkflowGraph {
  return WorkflowGraphSchema.parse(graph);
}

// Trigger types are recognized by `node.type`. Adding a new trigger kind only
// needs to register it here (and a manifest in the worker registry).
const TRIGGER_NODE_TYPES = new Set<string>(["trigger"]);

export function isTriggerNode(node: { type: string }): boolean {
  return TRIGGER_NODE_TYPES.has(node.type);
}

// Helper function to check if a graph is valid for execution.
// Structural-only: ≥1 trigger, all edges reference real nodes, no cycle hint.
// "What kinds of nodes must exist" is a registry concern, not engine.
export function isExecutableGraph(graph: WorkflowGraph): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const triggerNodes = graph.nodes.filter(isTriggerNode);
  if (triggerNodes.length === 0) {
    errors.push("Workflow must have at least one trigger node");
  }

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }
  }

  // Cheap shallow cycle hint: nothing should point back into a trigger.
  // Real DAG cycle detection runs in the worker engine before execution.
  const triggerIds = new Set(triggerNodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (triggerIds.has(edge.target) && !triggerIds.has(edge.source)) {
      errors.push("Workflow contains a cycle: non-trigger node points back to trigger");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
