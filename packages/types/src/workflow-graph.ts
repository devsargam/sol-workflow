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
    "cron",
  ]),
  config: z.object({
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

    // Cron trigger specific
    schedule: z.string().optional(), // Cron expression like "*/5 * * * *"
    timezone: z.string().optional(), // Timezone like "UTC" or "America/New_York"
  }),
});

// Filter node data schema
export const FilterNodeDataSchema = z.object({
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "equals",
        "not_equals",
        "greater_than",
        "less_than",
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
  actionType: z.enum(["send_sol", "send_spl_token", "call_program"]),
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

// Notify node data schema
export const NotifyNodeDataSchema = z
  .object({
    notifyType: z.enum(["discord", "telegram", "slack", "email", "webhook"]),

    webhookUrl: z.string().optional(),

    telegramBotToken: z.string().min(1).optional(),
    telegramChatId: z.string().min(1).optional(),
    telegramParseMode: z.enum(["Markdown", "MarkdownV2", "HTML"]).optional(),
    telegramDisableWebPreview: z.boolean().optional(),

    template: z.enum(["default", "success", "error", "minimal", "detailed"]),
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

    if (data.notifyType === "telegram") {
      if (!data.telegramBotToken) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telegramBotToken"],
          message: "telegramBotToken is required for telegram notifications",
        });
      }
      if (!data.telegramChatId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["telegramChatId"],
          message: "telegramChatId is required for telegram notifications",
        });
      }
    }
  });

// Union of all node data types
export const NodeDataSchema = z.union([
  z.object({ nodeType: z.literal("trigger"), ...TriggerNodeDataSchema.shape }),
  z.object({ nodeType: z.literal("filter"), ...FilterNodeDataSchema.shape }),
  z.object({ nodeType: z.literal("action"), ...ActionNodeDataSchema.shape }),
  z.object({ nodeType: z.literal("notify") }).and(NotifyNodeDataSchema),
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

// Helper function to check if a graph is valid for execution
export function isExecutableGraph(graph: WorkflowGraph): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Must have at least one trigger node
  const triggerNodes = graph.nodes.filter((n) => n.type === "trigger");
  if (triggerNodes.length === 0) {
    errors.push("Workflow must have at least one trigger node");
  }

  // Must have at least one action OR notify node (workflows can be notification-only)
  const actionNodes = graph.nodes.filter((n) => n.type === "action");
  const notifyNodes = graph.nodes.filter((n) => n.type === "notify");
  if (actionNodes.length === 0 && notifyNodes.length === 0) {
    errors.push("Workflow must have at least one action or notify node");
  }

  // Check that all edges reference valid nodes
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }
  }

  // Check for cycles (simplified check - just ensure no node points back to trigger)
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
