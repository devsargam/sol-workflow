import type {
  WorkflowGraph,
  WorkflowNode,
  TriggerNodeData,
  ActionNodeData,
  NotifyNodeData,
} from "./workflow-graph";

export type ValidationError = string;

type NodeValidator = (node: WorkflowNode) => ValidationError[];

const triggerValidators: Record<string, NodeValidator> = {
  balance_change: (node) => {
    const data = node.data as TriggerNodeData;
    const config = data?.config || {};
    const errors: ValidationError[] = [];

    if (
      !config.address ||
      typeof config.address !== "string" ||
      config.address.trim().length === 0
    ) {
      errors.push(`Trigger node ${node.id}: Wallet address is required`);
    }

    return errors;
  },
  // Add more trigger validators here as needed:
};

const actionValidators: Record<string, NodeValidator> = {
  send_sol: (node) => {
    const data = node.data as ActionNodeData;
    const config = data?.config || {};
    const errors: ValidationError[] = [];

    if (
      !config.toAddress ||
      typeof config.toAddress !== "string" ||
      config.toAddress.trim().length === 0
    ) {
      errors.push(`Action node ${node.id}: Recipient address is required`);
    }

    if (!config.amount || typeof config.amount !== "number" || config.amount <= 0) {
      errors.push(`Action node ${node.id}: Amount is required`);
    }

    return errors;
  },
  // Add more action validators here as needed:
  // send_spl_token: (node) => { ... },
  // call_program: (node) => { ... },
};

const notifyValidators: Record<string, NodeValidator> = {
  discord: (node) => {
    const data = node.data as NotifyNodeData;
    const errors: ValidationError[] = [];
    const webhookUrl = data?.webhookUrl;

    if (!webhookUrl || typeof webhookUrl !== "string" || webhookUrl.trim().length === 0) {
      errors.push(`Notify node ${node.id}: Discord webhook URL is required`);
    }

    return errors;
  },
  telegram: (node) => {
    const data = node.data as NotifyNodeData;
    const errors: ValidationError[] = [];

    if (
      !data.telegramBotToken ||
      typeof data.telegramBotToken !== "string" ||
      data.telegramBotToken.trim().length === 0
    ) {
      errors.push(`Notify node ${node.id}: Telegram bot token is required`);
    }

    if (
      !data.telegramChatId ||
      typeof data.telegramChatId !== "string" ||
      data.telegramChatId.trim().length === 0
    ) {
      errors.push(`Notify node ${node.id}: Telegram chat ID is required`);
    }

    return errors;
  },
  webhook: (node) => {
    const data = node.data as NotifyNodeData;
    const errors: ValidationError[] = [];
    const webhookUrl = data?.webhookUrl;

    if (!webhookUrl || typeof webhookUrl !== "string" || webhookUrl.trim().length === 0) {
      errors.push(`Notify node ${node.id}: Webhook URL is required`);
    }

    return errors;
  },
  // Add more notify validators here as needed:
  // slack: (node) => { ... },
};

function validateTriggerNodes(nodes: WorkflowNode[]): ValidationError[] {
  const triggerNodes = nodes.filter((n) => n.type === "trigger");
  const errors: ValidationError[] = [];

  if (triggerNodes.length === 0) {
    errors.push("Workflow must have at least one trigger node");
    return errors;
  }

  for (const node of triggerNodes) {
    const data = node.data as TriggerNodeData;
    const triggerType = data?.triggerType;
    if (triggerType && triggerValidators[triggerType]) {
      errors.push(...triggerValidators[triggerType](node));
    }
  }

  return errors;
}

function validateActionNodes(nodes: WorkflowNode[]): ValidationError[] {
  const actionNodes = nodes.filter((n) => n.type === "action");
  const errors: ValidationError[] = [];

  if (actionNodes.length === 0) {
    errors.push("Workflow must have at least one action node");
    return errors;
  }

  for (const node of actionNodes) {
    const data = node.data as ActionNodeData;
    const actionType = data?.actionType;
    if (actionType && actionValidators[actionType]) {
      errors.push(...actionValidators[actionType](node));
    }
  }

  return errors;
}

function validateNotifyNodes(nodes: WorkflowNode[]): ValidationError[] {
  const notifyNodes = nodes.filter((n) => n.type === "notify");
  const errors: ValidationError[] = [];

  for (const node of notifyNodes) {
    const data = node.data as NotifyNodeData;

    if (data.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
      for (let i = 0; i < data.notifications.length; i++) {
        const notification: any = data.notifications[i];
        const notifyType = notification?.notifyType;

        if (!notifyType) {
          errors.push(
            `Notify node ${node.id} (notification ${i + 1}): Notification type is required`
          );
          continue;
        }

        if (notifyValidators[notifyType]) {
          const tempNode: WorkflowNode = {
            ...node,
            data: {
              nodeType: "notify" as const,
              notifyType: notification.notifyType as any,
              webhookUrl: notification.webhookUrl,
              telegramBotToken: notification.telegramBotToken,
              telegramChatId: notification.telegramChatId,
              telegramParseMode: notification.telegramParseMode as any,
              telegramDisableWebPreview: notification.telegramDisableWebPreview,
              template: notification.template as any,
              customMessage: notification.customMessage,
            } as any,
          };
          const validationErrors = notifyValidators[notifyType](tempNode);
          errors.push(
            ...validationErrors.map((err) =>
              err.replace(
                `Notify node ${node.id}:`,
                `Notify node ${node.id} (notification ${i + 1}):`
              )
            )
          );
        } else {
          errors.push(
            `Notify node ${node.id} (notification ${i + 1}): Unknown notification type: ${notifyType}`
          );
        }
      }
    } else if (data.notifyType) {
      const notifyType = data.notifyType;
      if (notifyValidators[notifyType]) {
        errors.push(...notifyValidators[notifyType](node));
      } else {
        errors.push(`Notify node ${node.id}: Unknown notification type: ${notifyType}`);
      }
    } else {
      errors.push(`Notify node ${node.id}: No notification configuration found`);
    }
  }

  return errors;
}

export function validateWorkflowGraphForBuilder(graph: WorkflowGraph | unknown): ValidationError[] {
  if (!graph || typeof graph !== "object") {
    return ["Invalid workflow graph: graph is required"];
  }

  const typedGraph = graph as WorkflowGraph;
  const nodes = Array.isArray(typedGraph.nodes) ? typedGraph.nodes : [];

  return [
    ...validateTriggerNodes(nodes),
    ...validateActionNodes(nodes),
    ...validateNotifyNodes(nodes),
  ];
}
