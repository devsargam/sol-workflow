import type { WorkflowGraph } from "@repo/types";

type WorkflowTemplate = {
  description: string;
  graph: WorkflowGraph;
  id: string;
  name: string;
};

const edgeStyle = {
  stroke: "var(--edge-color)",
  strokeWidth: 1.5,
};

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
];

export function getWorkflowTemplate(id: string | null) {
  if (!id) return null;
  return workflowTemplates.find((template) => template.id === id) ?? null;
}
