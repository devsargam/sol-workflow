import { z } from "zod";
import { ActionTypeEnum } from "./actions";
import { TriggerTypeEnum } from "./triggers";
import type { WorkflowEdge, WorkflowGraph, WorkflowNode } from "./workflow-graph";

const AgentNotificationTypeEnum = z.enum(["discord", "telegram", "email", "webhook"]);
const AgentNotificationTemplateEnum = z.enum([
  "default",
  "success",
  "error",
  "minimal",
  "detailed",
]);

const AgentFilterOperatorEnum = z.enum([
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
]);

function normalizeTypeAlias(value: unknown, aliases: Record<string, string>) {
  if (typeof value !== "string") {
    return value;
  }

  const key = value.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return aliases[key] ?? value;
}

const AgentTriggerTypeSchema = z.preprocess(
  (value) =>
    normalizeTypeAlias(value, {
      wallet: "balance_change",
      wallet_activity: "balance_change",
      wallet_balance: "balance_change",
      wallet_balance_change: "balance_change",
      transaction: "transaction_status",
      transaction_activity: "transaction_status",
      tx_status: "transaction_status",
      token: "token_receipt",
      token_received: "token_receipt",
      nft: "nft_receipt",
      nft_received: "nft_receipt",
      program_logs: "program_log",
      token_listing: "new_token_listing",
      new_listing: "new_token_listing",
      schedule: "cron",
      scheduled: "cron",
      time: "cron",
      http: "webhook",
      paid_webhook: "x402_payment",
      x402: "x402_payment",
      x402_webhook: "x402_payment",
      x402_payment: "x402_payment",
    }),
  TriggerTypeEnum
);

const AgentActionTypeSchema = z.preprocess(
  (value) =>
    normalizeTypeAlias(value, {
      none: "do_nothing",
      noop: "do_nothing",
      no_op: "do_nothing",
      transfer_sol: "send_sol",
      sol_transfer: "send_sol",
      send_token: "send_spl_token",
      transfer_token: "send_spl_token",
      spl_transfer: "send_spl_token",
      program_call: "call_program",
    }),
  ActionTypeEnum
);

const AgentNotificationTypeSchema = z.preprocess(
  (value) =>
    normalizeTypeAlias(value, {
      discord_webhook: "discord",
      discord_notification: "discord",
      telegram_message: "telegram",
      telegram_notification: "telegram",
      email_notification: "email",
      webhook_notification: "webhook",
      http_webhook: "webhook",
    }),
  AgentNotificationTypeEnum
);

export const AgentWorkflowDraftSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  trigger: z.object({
    type: AgentTriggerTypeSchema,
    config: z.record(z.unknown()).optional(),
  }),
  filters: z
    .array(
      z.object({
        field: z.string().min(1),
        operator: AgentFilterOperatorEnum,
        value: z.unknown(),
      })
    )
    .optional(),
  actions: z
    .array(
      z.object({
        type: AgentActionTypeSchema,
        config: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  notifications: z
    .array(
      z.object({
        type: AgentNotificationTypeSchema,
        template: AgentNotificationTemplateEnum.optional(),
        config: z.record(z.unknown()).optional(),
        message: z.string().optional(),
      })
    )
    .optional(),
});

export type AgentWorkflowDraft = z.infer<typeof AgentWorkflowDraftSchema>;

export type WorkflowDraftLayoutOptions = {
  viewportWidth?: number;
  viewportHeight?: number;
  paddingX?: number;
  paddingY?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  preferredColumnGap?: number;
  preferredRowGap?: number;
};

type LayoutNodeInput = Pick<WorkflowNode, "id" | "type" | "data">;
type AgentNotificationDraft = NonNullable<AgentWorkflowDraft["notifications"]>[number];

type LayoutStage = {
  id: string;
  nodes: LayoutNodeInput[];
};

const defaultLayoutOptions = {
  viewportWidth: 1280,
  viewportHeight: 720,
  paddingX: 80,
  paddingY: 96,
  nodeWidth: 240,
  nodeHeight: 96,
  preferredColumnGap: 360,
  preferredRowGap: 160,
} satisfies Required<WorkflowDraftLayoutOptions>;

const edgeStyle = {
  stroke: "var(--edge-color)",
  strokeWidth: 1.5,
};

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "node";
}

function getConfigValue(config: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    if (config[alias] !== undefined) {
      return config[alias];
    }
  }

  const normalizedEntries = new Map(
    Object.entries(config).map(([key, value]) => [
      key.replace(/[^a-z0-9]/gi, "").toLowerCase(),
      value,
    ])
  );

  for (const alias of aliases) {
    const value = normalizedEntries.get(alias.replace(/[^a-z0-9]/gi, "").toLowerCase());
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function normalizeTriggerConfig(trigger: AgentWorkflowDraft["trigger"]) {
  const config = { ...(trigger.config ?? {}) };

  if (trigger.type === "balance_change") {
    config.address =
      config.address ??
      getConfigValue(config, [
        "walletAddress",
        "wallet",
        "wallet_address",
        "WALLET_ADDRESS",
        "account",
        "accountAddress",
      ]);
  }

  if (trigger.type === "token_receipt") {
    config.tokenAccount =
      config.tokenAccount ??
      getConfigValue(config, ["token_account", "TOKEN_ACCOUNT", "account", "accountAddress"]);
  }

  if (trigger.type === "nft_receipt") {
    config.walletAddress =
      config.walletAddress ??
      getConfigValue(config, ["address", "wallet", "wallet_address", "WALLET_ADDRESS"]);
  }

  if (trigger.type === "program_log") {
    config.programId =
      config.programId ?? getConfigValue(config, ["program", "program_id", "PROGRAM_ID"]);
  }

  if (trigger.type === "webhook" || trigger.type === "x402_payment") {
    config.webhookId =
      config.webhookId ?? getConfigValue(config, ["webhook", "webhook_id", "WEBHOOK_ID", "id"]);
  }

  if (trigger.type === "x402_payment") {
    config.payTo =
      config.payTo ??
      getConfigValue(config, ["payTo", "pay_to", "recipient", "recipientWallet", "wallet"]);
    config.price = config.price ?? getConfigValue(config, ["price", "amount", "cost"]);
    config.network = config.network ?? "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";
  }

  return config;
}

function getNotificationConfig(notification: AgentNotificationDraft) {
  const config = notification.config ?? {};
  const base = {
    notifyType: notification.type,
    template: notification.template ?? "default",
    customMessage: notification.message,
  };

  if (notification.type === "telegram") {
    return {
      ...base,
      telegramBotToken: config.telegramBotToken ?? config.botToken,
      telegramChatId: config.telegramChatId ?? config.chatId,
      telegramParseMode: config.telegramParseMode ?? config.parseMode,
      telegramDisableWebPreview:
        config.telegramDisableWebPreview ?? config.disableWebPreview,
    };
  }

  return {
    ...base,
    webhookUrl: config.webhookUrl ?? getConfigValue(config, [
      "url",
      "webhook",
      "discordWebhookUrl",
      "discord_webhook_url",
      "DISCORD_WEBHOOK_URL",
      "notificationUrl",
    ]),
    webhookSecret:
      config.webhookSecret ??
      getConfigValue(config, ["secret", "webhook_secret", "WEBHOOK_SECRET"]),
  };
}

function buildLayoutStages(draft: AgentWorkflowDraft): LayoutStage[] {
  const stages: LayoutStage[] = [
    {
      id: "trigger",
      nodes: [
        {
          id: "trigger-1",
          type: "trigger",
          data: {
            nodeType: "trigger",
            triggerType: draft.trigger.type,
            config: normalizeTriggerConfig(draft.trigger),
          },
        },
      ],
    },
  ];

  if (draft.filters?.length) {
    stages.push({
      id: "filter",
      nodes: [
        {
          id: "filter-1",
          type: "filter",
          data: {
            nodeType: "filter",
            logic: "and",
            conditions: draft.filters,
          },
        },
      ],
    });
  }

  if (draft.actions?.length) {
    stages.push({
      id: "actions",
      nodes: draft.actions.map((action, index) => ({
        id: `action-${index + 1}-${slugify(action.type)}`,
        type: "action",
        data: {
          nodeType: "action",
          actionType: action.type,
          config: action.config ?? {},
        },
      })),
    });
  }

  if (draft.notifications?.length) {
    stages.push({
      id: "notifications",
      nodes: draft.notifications.map((notification, index) => ({
        id: `notify-${index + 1}-${slugify(notification.type)}`,
        type: "notify",
        data: {
          nodeType: "notify",
          notifications: [getNotificationConfig(notification)],
        },
      })),
    });
  }

  return stages;
}

export function layoutWorkflowStages(
  stages: LayoutStage[],
  options: WorkflowDraftLayoutOptions = {}
): WorkflowNode[] {
  const layout = { ...defaultLayoutOptions, ...options };
  const maxStageSize = Math.max(...stages.map((stage) => stage.nodes.length), 1);
  const usableWidth = Math.max(layout.viewportWidth - layout.paddingX * 2 - layout.nodeWidth, 0);
  const usableHeight = Math.max(layout.viewportHeight - layout.paddingY * 2 - layout.nodeHeight, 0);
  const columnGap =
    stages.length > 1
      ? Math.min(layout.preferredColumnGap, usableWidth / (stages.length - 1))
      : 0;
  const rowGap =
    maxStageSize > 1
      ? Math.min(layout.preferredRowGap, usableHeight / (maxStageSize - 1))
      : 0;
  const totalWidth = columnGap * Math.max(stages.length - 1, 0) + layout.nodeWidth;
  const startX = Math.max((layout.viewportWidth - totalWidth) / 2, layout.paddingX);

  return stages.flatMap((stage, stageIndex) => {
    const groupHeight = rowGap * Math.max(stage.nodes.length - 1, 0) + layout.nodeHeight;
    const startY = Math.max((layout.viewportHeight - groupHeight) / 2, layout.paddingY);

    return stage.nodes.map((node, nodeIndex) => ({
      ...node,
      position: {
        x: Math.round(startX + stageIndex * columnGap),
        y: Math.round(startY + nodeIndex * rowGap),
      },
    }));
  });
}

function createStageEdges(stages: LayoutStage[]): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [];

  for (let stageIndex = 0; stageIndex < stages.length - 1; stageIndex += 1) {
    const sourceStage = stages[stageIndex];
    const targetStage = stages[stageIndex + 1];

    if (!sourceStage || !targetStage) continue;

    for (const source of sourceStage.nodes) {
      for (const target of targetStage.nodes) {
        edges.push({
          id: `edge-${source.id}-${target.id}`,
          source: source.id,
          sourceHandle: source.type === "filter" ? "if" : "output",
          target: target.id,
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        });
      }
    }
  }

  return edges;
}

export function compileAgentWorkflowDraft(
  input: AgentWorkflowDraft,
  options?: WorkflowDraftLayoutOptions
): WorkflowGraph {
  const draft = AgentWorkflowDraftSchema.parse(input);
  const stages = buildLayoutStages(draft);

  return {
    nodes: layoutWorkflowStages(stages, options),
    edges: createStageEdges(stages),
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}
