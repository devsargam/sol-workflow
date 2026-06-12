import {
  ActionTypeEnum,
  TriggerTypeEnum,
  type ActionNodeData,
  type FilterNodeData,
  type NotifyNodeData,
  type TriggerNodeData,
  type WorkflowGraph,
  type WorkflowNode,
  isExecutableGraph,
  validateWorkflowGraphForBuilder,
} from "@repo/types";
import { API, CRON, WORKFLOW_METADATA } from "utils";

type WorkflowRecord = {
  id: string;
  name: string;
  description: string | null;
  graph: unknown;
  metadata: unknown;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const filterOperators = [
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
] as const;

const notificationTypes = ["discord", "telegram", "email", "webhook"] as const;
const notificationTemplates = ["default", "success", "error", "minimal", "detailed"] as const;
const triggerTypes = TriggerTypeEnum.options;
const actionTypes = ActionTypeEnum.options;

function summarizeNode(node: WorkflowNode) {
  const data = node.data as
    | TriggerNodeData
    | FilterNodeData
    | ActionNodeData
    | NotifyNodeData;

  if (node.type === "trigger") {
    const triggerData = data as TriggerNodeData;
    const triggerType = triggerData.triggerType;
    const webhookId = triggerData.config?.webhookId;

    return {
      id: node.id,
      nodeType: "trigger",
      kind: triggerType,
      label: `${triggerType ?? "unknown"} trigger`,
      position: node.position,
      configKeys: Object.keys(triggerData.config ?? {}),
      webhook:
        (triggerType === "webhook" || triggerType === "x402_payment") && webhookId
          ? {
              webhookId,
              genericPath: `${API.ROUTES.WEBHOOKS}/${webhookId}`,
              scopedPath: `${API.ROUTES.WEBHOOKS}/{workflowId}/${node.id}/${webhookId}`,
              authEnabled:
                triggerType === "webhook" ? Boolean(triggerData.config?.authEnabled) : false,
              paymentRequired: triggerType === "x402_payment",
              inputFields: triggerData.config?.inputFormat ?? [],
            }
          : undefined,
    };
  }

  if (node.type === "filter") {
    const filterData = data as FilterNodeData;
    return {
      id: node.id,
      nodeType: "filter",
      kind: filterData.logic ?? "and",
      label: `${filterData.logic ?? "and"} filter`,
      position: node.position,
      conditionCount: filterData.conditions?.length ?? 0,
      conditions: filterData.conditions ?? [],
    };
  }

  if (node.type === "action") {
    const actionData = data as ActionNodeData;
    return {
      id: node.id,
      nodeType: "action",
      kind: actionData.actionType,
      label: `${actionData.actionType ?? "unknown"} action`,
      position: node.position,
      configKeys: Object.keys(actionData.config ?? {}),
    };
  }

  const notifyData = data as NotifyNodeData;
  const notifications =
    notifyData.notifications && notifyData.notifications.length > 0
      ? notifyData.notifications
      : notifyData.notifyType
        ? [
            {
              notifyType: notifyData.notifyType,
              template: notifyData.template,
            },
          ]
        : [];

  return {
    id: node.id,
    nodeType: "notify",
    kind: notifications.map((notification) => notification.notifyType).join(",") || "unknown",
    label: "notification",
    position: node.position,
    notificationCount: notifications.length,
    notifications: notifications.map((notification) => ({
      notifyType: notification.notifyType,
      template: notification.template ?? "default",
    })),
  };
}

function getGraphDiagnostics(graph: WorkflowGraph) {
  const executable = isExecutableGraph(graph);
  const builderErrors = validateWorkflowGraphForBuilder(graph);

  return {
    executable: executable.valid,
    executableErrors: executable.errors,
    builderErrors,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    triggerCount: graph.nodes.filter((node) => node.type === "trigger").length,
    filterCount: graph.nodes.filter((node) => node.type === "filter").length,
    actionCount: graph.nodes.filter((node) => node.type === "action").length,
    notifyCount: graph.nodes.filter((node) => node.type === "notify").length,
  };
}

export function buildWorkflowAgentDetail(workflow: WorkflowRecord) {
  const graph = workflow.graph as WorkflowGraph;

  return {
    workflow: {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      enabled: workflow.enabled,
      metadata: workflow.metadata,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    },
    diagnostics: getGraphDiagnostics(graph),
    graph,
    summary: {
      nodes: graph.nodes.map(summarizeNode),
      edges: graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type ?? "default",
      })),
      viewport: graph.viewport,
    },
    agentHints: {
      updateWorkflow: {
        method: "PATCH",
        path: `${API.ROUTES.WORKFLOWS}/${workflow.id}`,
        body: "Any subset of { name, description, graph, metadata }",
      },
      toggleWorkflow: {
        method: "POST",
        path: `${API.ROUTES.WORKFLOWS}/${workflow.id}/toggle`,
      },
      createSimilarWorkflow: {
        method: "POST",
        path: API.ROUTES.WORKFLOWS,
        body: "Use the returned graph as a starting point, replace ids, positions, config, name, and description.",
      },
    },
  };
}

export function buildAgentWorkflowCapabilities() {
  return {
    purpose:
      "Machine-readable workflow builder contract for agents. Use this before creating or editing workflows.",
    authentication: {
      required: true,
      header: "Authorization: Bearer <wallet-session-token>",
    },
    endpoints: {
      listWorkflows: { method: "GET", path: API.ROUTES.WORKFLOWS },
      validateWorkflow: {
        method: "POST",
        path: `${API.ROUTES.WORKFLOWS}/validate`,
        body: "Same draft shape as createWorkflow: { name?, description?, graph, metadata? }",
        response:
          "{ valid, errors, checks: { body, graphSchema, executableGraph, nodeConfiguration, cron, builder }, summary }",
      },
      createWorkflow: { method: "POST", path: API.ROUTES.WORKFLOWS },
      workflowAgentDetail: {
        method: "GET",
        path: `${API.ROUTES.WORKFLOWS}/{workflowId}/agent`,
      },
      updateWorkflow: {
        method: "PATCH",
        path: `${API.ROUTES.WORKFLOWS}/{workflowId}`,
      },
      toggleWorkflow: {
        method: "POST",
        path: `${API.ROUTES.WORKFLOWS}/{workflowId}/toggle`,
      },
      webhookTrigger: {
        generic: `${API.ROUTES.WEBHOOKS}/{webhookId}`,
        scoped: `${API.ROUTES.WEBHOOKS}/{workflowId}/{triggerNodeId}/{webhookId}`,
      },
    },
    createWorkflowBody: {
      name: "string, 1-100 chars",
      description: "optional string, max 500 chars",
      graph: "WorkflowGraph",
      metadata: {
        version: WORKFLOW_METADATA.VERSION,
        maxSolPerTx: WORKFLOW_METADATA.LIMITS.MAX_SOL_PER_TX,
        maxExecutionsPerHour: WORKFLOW_METADATA.LIMITS.MAX_EXECUTIONS_PER_HOUR,
        createdWith: WORKFLOW_METADATA.CREATED_WITH.API,
      },
    },
    graphShape: {
      nodes:
        "Array of React Flow style nodes: { id, type: trigger|filter|action|notify, position: { x, y }, data }",
      edges:
        "Array of edges: { id, source, target, sourceHandle?, targetHandle?, type?, animated?, style?, data? }",
      viewport: "Optional { x, y, zoom }",
      minimumExecutableGraph:
        "At least one trigger node and at least one action or notify node. Edges must reference existing node ids.",
    },
    nodeTypes: {
      trigger: {
        dataShape: {
          nodeType: "trigger",
          triggerType: triggerTypes,
          config: "Fields depend on triggerType; include only relevant config keys.",
        },
        triggerTypes: {
          balance_change: {
            requiredConfig: ["address"],
            optionalConfig: ["minChange", "changeType"],
            notes: "changeType is one of increase, decrease, any.",
          },
          token_receipt: {
            requiredConfig: ["tokenAccount"],
            optionalConfig: ["tokenMint", "minAmount"],
          },
          nft_receipt: {
            requiredConfig: ["walletAddress"],
            optionalConfig: ["collectionAddress", "verifiedOnly"],
          },
          transaction_status: {
            requiredConfig: [],
            optionalConfig: ["signature", "programId", "accountInvolved", "statusType"],
            notes: "statusType is success, failed, or any in workflow graphs.",
          },
          program_log: {
            requiredConfig: ["programId"],
            optionalConfig: ["logPattern", "mentionedAccounts"],
          },
          new_token_listing: {
            requiredConfig: ["source"],
            optionalConfig: [
              "includeMemePlatforms",
              "minLiquidityUsd",
              "minVolume24hUsd",
              "limit",
              "pollIntervalSeconds",
            ],
            notes:
              "Uses Dolphinflow's Birdeye integration. Runtime requires BIRDEYE_API_KEY on the listener service.",
          },
          cron: {
            requiredConfig: ["schedule"],
            optionalConfig: ["timezone"],
            presets: CRON.PRESETS,
            commonTimezones: CRON.COMMON_TIMEZONES,
            notes: `Minimum interval is ${CRON.MIN_INTERVAL_SECONDS} seconds.`,
          },
          webhook: {
            requiredConfig: ["webhookId"],
            optionalConfig: ["authEnabled", "authHeaderName", "authHeaderValue", "inputFormat"],
            notes:
              "inputFormat documents expected webhook fields for agents and users; webhookId becomes the public trigger path.",
          },
          x402_payment: {
            requiredConfig: ["webhookId", "payTo", "price"],
            optionalConfig: ["description", "inputFormat"],
            notes:
              "Paid webhook trigger. The caller must satisfy an x402 payment before the workflow is queued. Initial network is Solana devnet.",
          },
        },
      },
      filter: {
        dataShape: {
          nodeType: "filter",
          logic: ["and", "or"],
          conditions: [
            {
              field: "string path from trigger/action context, e.g. input.amount",
              operator: filterOperators,
              value: "string | number | boolean | object",
            },
          ],
        },
      },
      action: {
        dataShape: {
          nodeType: "action",
          actionType: actionTypes,
          config: "Fields depend on actionType; include only relevant config keys.",
        },
        actionTypes: {
          send_sol: {
            requiredConfig: ["toAddress", "amount"],
            optionalConfig: ["fromKeypair", "usePDA", "pdaSeed"],
            notes: "amount is in lamports.",
          },
          send_spl_token: {
            requiredConfig: ["fromTokenAccount", "toTokenAccount", "tokenMint", "amount"],
            optionalConfig: ["fromKeypair", "decimals", "usePDA", "pdaSeed"],
          },
          call_program: {
            requiredConfig: ["programId", "instruction", "accounts"],
            optionalConfig: ["idl", "args", "signerKeypair", "usePDA", "pdaSeed"],
          },
          do_nothing: {
            requiredConfig: [],
            optionalConfig: [],
          },
        },
      },
      notify: {
        dataShape: {
          nodeType: "notify",
          notifications:
            "Preferred array of notification configs. Legacy single-channel fields are also accepted.",
        },
        notificationTypes,
        templates: notificationTemplates,
        channels: {
          discord: {
            requiredConfig: ["webhookUrl"],
            optionalConfig: ["template", "customMessage"],
          },
          telegram: {
            requiredConfig: ["telegramBotToken", "telegramChatId"],
            optionalConfig: [
              "telegramParseMode",
              "telegramDisableWebPreview",
              "template",
              "customMessage",
            ],
          },
          email: {
            requiredConfig: [],
            optionalConfig: ["template", "customMessage"],
            notes: "Schema accepts email, but delivery support may depend on configured integrations.",
          },
          webhook: {
            requiredConfig: ["webhookUrl", "webhookSecret"],
            optionalConfig: ["template", "customMessage"],
          },
        },
      },
    },
    examples: {
      cronToDiscord: {
        name: "Hourly Discord heartbeat",
        description: "Runs once an hour and sends a Discord notification.",
        graph: {
          nodes: [
            {
              id: "trigger-1",
              type: "trigger",
              position: { x: 0, y: 0 },
              data: {
                nodeType: "trigger",
                triggerType: "cron",
                config: { schedule: CRON.PRESETS.EVERY_HOUR, timezone: "UTC" },
              },
            },
            {
              id: "notify-1",
              type: "notify",
              position: { x: 320, y: 0 },
              data: {
                nodeType: "notify",
                notifications: [
                  {
                    notifyType: "discord",
                    webhookUrl: "https://discord.com/api/webhooks/...",
                    template: "default",
                  },
                ],
              },
            },
          ],
          edges: [
            {
              id: "edge-trigger-1-notify-1",
              source: "trigger-1",
              target: "notify-1",
              type: "smoothstep",
            },
          ],
        },
      },
      webhookToSolTransfer: {
        name: "Webhook SOL transfer",
        description: "Receives a webhook and sends SOL if the payload passes a filter.",
        graph: {
          nodes: [
            {
              id: "trigger-1",
              type: "trigger",
              position: { x: 0, y: 0 },
              data: {
                nodeType: "trigger",
                triggerType: "webhook",
                config: {
                  webhookId: "agent-created-hook",
                  inputFormat: [
                    {
                      name: "amount",
                      type: "number",
                      description: "Lamports requested by caller",
                    },
                  ],
                },
              },
            },
            {
              id: "filter-1",
              type: "filter",
              position: { x: 320, y: 0 },
              data: {
                nodeType: "filter",
                logic: "and",
                conditions: [{ field: "input.amount", operator: "less_than_or_equal", value: 1000 }],
              },
            },
            {
              id: "action-1",
              type: "action",
              position: { x: 640, y: 0 },
              data: {
                nodeType: "action",
                actionType: "send_sol",
                config: {
                  toAddress: "ReplaceWithSolanaAddress111111111111111111",
                  amount: 1000,
                  usePDA: true,
                },
              },
            },
          ],
          edges: [
            {
              id: "edge-trigger-1-filter-1",
              source: "trigger-1",
              target: "filter-1",
              type: "smoothstep",
            },
            {
              id: "edge-filter-1-action-1",
              source: "filter-1",
              target: "action-1",
              type: "smoothstep",
            },
          ],
        },
      },
      copyTradingWebhook: {
        name: "Copy trading signal",
        description:
          "Receives an authenticated trade signal, enforces lead-wallet and risk guardrails, then mirrors the approved swap route.",
        graph: {
          nodes: [
            {
              id: "trigger-copy-signal",
              type: "trigger",
              position: { x: 0, y: 0 },
              data: {
                nodeType: "trigger",
                triggerType: "webhook",
                config: {
                  webhookId: "copy-trade-signal",
                  authEnabled: true,
                  authHeaderName: "Authorization",
                  authHeaderValue: "Bearer replace-before-enable",
                  inputFormat: [
                    {
                      name: "leadWallet",
                      type: "string",
                      description: "Lead trader wallet or strategy identifier",
                    },
                    {
                      name: "amountUsd",
                      type: "number",
                      description: "Requested mirrored trade notional",
                    },
                    {
                      name: "confidence",
                      type: "number",
                      description: "Signal confidence from 0 to 1",
                    },
                    {
                      name: "slippageBps",
                      type: "number",
                      description: "Maximum allowed slippage in basis points",
                    },
                    {
                      name: "routePlan",
                      type: "object",
                      description: "Router quote or swap route metadata",
                    },
                  ],
                },
              },
            },
            {
              id: "filter-copy-risk",
              type: "filter",
              position: { x: 340, y: 0 },
              data: {
                nodeType: "filter",
                logic: "and",
                conditions: [
                  {
                    field: "trigger.input.leadWallet",
                    operator: "==",
                    value: "LeadTraderWallet111111111111111111111111",
                  },
                  { field: "trigger.input.amountUsd", operator: "<=", value: 500 },
                  { field: "trigger.input.confidence", operator: ">=", value: 0.8 },
                  { field: "trigger.input.slippageBps", operator: "<=", value: 100 },
                ],
              },
            },
            {
              id: "action-copy-swap",
              type: "action",
              position: { x: 680, y: 0 },
              data: {
                nodeType: "action",
                actionType: "call_program",
                config: {
                  programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
                  instruction: "swap",
                  args: {
                    routePlan: "trigger.input.routePlan",
                    slippageBps: "trigger.input.slippageBps",
                  },
                },
              },
            },
            {
              id: "notify-copy-review",
              type: "notify",
              position: { x: 680, y: 220 },
              data: {
                nodeType: "notify",
                notifications: [
                  {
                    notifyType: "telegram",
                    template: "detailed",
                    customMessage:
                      "Copy trade was blocked or needs review before mirroring.",
                  },
                ],
              },
            },
          ],
          edges: [
            {
              id: "edge-copy-trigger-filter",
              source: "trigger-copy-signal",
              target: "filter-copy-risk",
              type: "smoothstep",
            },
            {
              id: "edge-copy-filter-action",
              source: "filter-copy-risk",
              sourceHandle: "if",
              target: "action-copy-swap",
              type: "smoothstep",
            },
            {
              id: "edge-copy-filter-review",
              source: "filter-copy-risk",
              sourceHandle: "else",
              target: "notify-copy-review",
              type: "smoothstep",
            },
            {
              id: "edge-copy-action-review",
              source: "action-copy-swap",
              sourceHandle: "error",
              target: "notify-copy-review",
              type: "smoothstep",
            },
          ],
        },
      },
    },
  };
}
