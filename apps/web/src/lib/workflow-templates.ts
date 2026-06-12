import type { WorkflowGraph } from "@repo/types";

type WorkflowTemplate = {
  description: string;
  graph: WorkflowGraph;
  id: string;
  name: string;
};

const FRESH_WEBHOOK_ID = "__fresh_webhook_id__";

const edgeStyle = {
  stroke: "var(--edge-color)",
  strokeWidth: 1.5,
};

function createFreshId(prefix: string) {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneTemplateGraph(graph: WorkflowGraph): WorkflowGraph {
  const cloned = JSON.parse(JSON.stringify(graph)) as WorkflowGraph;

  for (const node of cloned.nodes) {
    if (node.type !== "trigger") {
      continue;
    }

    const data = node.data as { config?: { webhookId?: string } };
    if (data.config?.webhookId === FRESH_WEBHOOK_ID) {
      data.config.webhookId = createFreshId("copy-trade-signal");
    }
  }

  return cloned;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "whale-wallet-monitor",
    name: "Whale Wallet Monitor",
    description:
      "Monitor large wallet balance changes and alert Telegram when movement exceeds 0.9 SOL.",
    graph: {
      nodes: [
        {
          id: "trigger-whale-activity",
          type: "trigger",
          position: { x: 80, y: 220 },
          data: {
            nodeType: "trigger",
            label: "Wallet balance change",
            type: "balance_change",
            triggerType: "balance_change",
            config: {
              address: "",
              changeType: "any",
              minChange: 900_000_000,
            },
          },
        },
        {
          id: "filter-whale-threshold",
          type: "filter",
          position: { x: 440, y: 220 },
          data: {
            nodeType: "filter",
            label: "Whale-sized move",
            logic: "and",
            conditions: [
              {
                field: "trigger.changeDirection",
                operator: "!=",
                value: "same",
              },
            ],
          },
        },
        {
          id: "notify-team",
          type: "notify",
          position: { x: 800, y: 220 },
          data: {
            nodeType: "notify",
            label: "Alert Telegram",
            notifications: [
              {
                notifyType: "telegram",
                template: "detailed",
                customMessage: "Whale wallet alert: the watched wallet moved at least 0.9 SOL.",
              },
            ],
          },
        },
      ],
      edges: [
        {
          id: "edge-trigger-to-filter",
          source: "trigger-whale-activity",
          sourceHandle: "output",
          target: "filter-whale-threshold",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
        {
          id: "edge-filter-to-notify",
          source: "filter-whale-threshold",
          sourceHandle: "if",
          target: "notify-team",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  },
  {
    id: "token-listing-alerts",
    name: "Token Listing Alerts",
    description:
      "Watch Birdeye for newly listed Solana tokens and alert Telegram when liquidity clears your threshold.",
    graph: {
      nodes: [
        {
          id: "trigger-new-token-listing",
          type: "trigger",
          position: { x: 80, y: 220 },
          data: {
            nodeType: "trigger",
            label: "Birdeye new listing",
            type: "new_token_listing",
            triggerType: "new_token_listing",
            config: {
              source: "birdeye",
              includeMemePlatforms: true,
              minLiquidityUsd: 10_000,
              limit: 10,
              pollIntervalSeconds: 60,
            },
          },
        },
        {
          id: "filter-listing-quality",
          type: "filter",
          position: { x: 440, y: 220 },
          data: {
            nodeType: "filter",
            label: "Liquidity threshold",
            logic: "and",
            conditions: [
              {
                field: "trigger.liquidityUsd",
                operator: ">=",
                value: 10_000,
              },
            ],
          },
        },
        {
          id: "notify-token-listing",
          type: "notify",
          position: { x: 800, y: 220 },
          data: {
            nodeType: "notify",
            label: "Notify Telegram",
            notifications: [
              {
                notifyType: "telegram",
                template: "detailed",
                customMessage:
                  "New Solana token listing cleared the configured liquidity threshold.",
              },
            ],
          },
        },
      ],
      edges: [
        {
          id: "edge-token-listing-to-filter",
          source: "trigger-new-token-listing",
          sourceHandle: "output",
          target: "filter-listing-quality",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
        {
          id: "edge-filter-to-token-notify",
          source: "filter-listing-quality",
          sourceHandle: "if",
          target: "notify-token-listing",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
  },
  {
    id: "copy-trading",
    name: "Copy Trading",
    description:
      "Receive signed trade signals from a lead wallet, apply max-size and confidence guardrails, then mirror approved swaps.",
    graph: {
      nodes: [
        {
          id: "trigger-copy-signal",
          type: "trigger",
          position: { x: 80, y: 220 },
          data: {
            nodeType: "trigger",
            label: "Signed trade signal",
            type: "webhook",
            triggerType: "webhook",
            config: {
              webhookId: FRESH_WEBHOOK_ID,
              authEnabled: true,
              authHeaderName: "Authorization",
              authHeaderValue: "Bearer change-me-before-activating",
              inputFormat: [
                {
                  name: "leadWallet",
                  type: "string",
                  description: "Wallet or strategy identifier that produced the trade signal",
                },
                {
                  name: "side",
                  type: "string",
                  description: "buy or sell",
                },
                {
                  name: "tokenMint",
                  type: "string",
                  description: "SPL token mint to mirror",
                },
                {
                  name: "amountUsd",
                  type: "number",
                  description: "Notional trade size requested by the source strategy",
                },
                {
                  name: "confidence",
                  type: "number",
                  description: "Signal confidence from 0 to 1",
                },
                {
                  name: "slippageBps",
                  type: "number",
                  description: "Maximum slippage requested in basis points",
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
          id: "filter-copy-guardrails",
          type: "filter",
          position: { x: 430, y: 220 },
          data: {
            nodeType: "filter",
            label: "Copy-trade guardrails",
            logic: "and",
            conditions: [
              {
                field: "trigger.input.leadWallet",
                operator: "==",
                value: "LeadTraderWallet111111111111111111111111",
              },
              {
                field: "trigger.input.amountUsd",
                operator: "<=",
                value: 500,
              },
              {
                field: "trigger.input.confidence",
                operator: ">=",
                value: 0.8,
              },
              {
                field: "trigger.input.slippageBps",
                operator: "<=",
                value: 100,
              },
            ],
          },
        },
        {
          id: "action-mirror-swap",
          type: "action",
          position: { x: 780, y: 165 },
          data: {
            nodeType: "action",
            label: "Mirror swap",
            type: "call_program",
            actionType: "call_program",
            config: {
              programId: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
              instruction: "swap",
              args: {
                source: "trigger.input.routePlan",
                maxSlippageBps: "trigger.input.slippageBps",
                tokenMint: "trigger.input.tokenMint",
              },
            },
          },
        },
        {
          id: "notify-copy-filled",
          type: "notify",
          position: { x: 1130, y: 165 },
          data: {
            nodeType: "notify",
            label: "Execution update",
            notifications: [
              {
                notifyType: "telegram",
                template: "detailed",
                customMessage:
                  "Copy trade approved and routed. Review the transaction signature before increasing size limits.",
              },
            ],
          },
        },
        {
          id: "notify-copy-review",
          type: "notify",
          position: { x: 780, y: 430 },
          data: {
            nodeType: "notify",
            label: "Review rejected signal",
            notifications: [
              {
                notifyType: "telegram",
                template: "detailed",
                customMessage:
                  "Copy trade was blocked by guardrails. Review lead wallet, size, confidence, or slippage settings.",
              },
            ],
          },
        },
      ],
      edges: [
        {
          id: "edge-copy-trigger-to-guardrails",
          source: "trigger-copy-signal",
          sourceHandle: "output",
          target: "filter-copy-guardrails",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
        {
          id: "edge-copy-guardrails-to-swap",
          source: "filter-copy-guardrails",
          sourceHandle: "if",
          target: "action-mirror-swap",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
        {
          id: "edge-copy-guardrails-to-review",
          source: "filter-copy-guardrails",
          sourceHandle: "else",
          target: "notify-copy-review",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
        {
          id: "edge-copy-swap-to-filled",
          source: "action-mirror-swap",
          sourceHandle: "success",
          target: "notify-copy-filled",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
        {
          id: "edge-copy-swap-error-to-review",
          source: "action-mirror-swap",
          sourceHandle: "error",
          target: "notify-copy-review",
          targetHandle: "input",
          type: "smoothstep",
          style: edgeStyle,
        },
      ],
      viewport: { x: 0, y: 0, zoom: 0.85 },
    },
  },
];

export function getWorkflowTemplate(id: string | null) {
  if (!id) return null;
  const template = workflowTemplates.find((item) => item.id === id);
  if (!template) return null;

  return {
    ...template,
    graph: cloneTemplateGraph(template.graph),
  };
}
