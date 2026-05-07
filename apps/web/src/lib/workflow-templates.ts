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
      "Monitor large wallet balance changes and alert Telegram plus Discord when movement exceeds the configured whale threshold.",
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
              address: "11111111111111111111111111111111",
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
            label: "Alert team",
            notifications: [
              {
                notifyType: "telegram",
                template: "detailed",
                customMessage:
                  "Whale wallet alert: the watched wallet moved at least the configured balance threshold.",
              },
              {
                notifyType: "discord",
                webhookUrl: "https://discord.com/api/webhooks/REPLACE_WITH_YOUR_WEBHOOK",
                template: "detailed",
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
];

export function getWorkflowTemplate(id: string | null) {
  if (!id) return null;
  return workflowTemplates.find((template) => template.id === id) ?? null;
}
