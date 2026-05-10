import type {
  WorkflowGraph,
  WorkflowNode,
  TriggerNodeData,
  ActionNodeData,
  NotifyNodeData,
} from "./workflow-graph";
import { WebhookTriggerConfigSchema, X402PaymentTriggerConfigSchema } from "./triggers";

export type ValidationError = string;

type NodeValidator = (node: WorkflowNode) => ValidationError[];
type TriggerConfigValidatorSchema =
  | typeof WebhookTriggerConfigSchema
  | typeof X402PaymentTriggerConfigSchema;

function validateTriggerConfigWithSchema(
  node: WorkflowNode,
  schema: TriggerConfigValidatorSchema
): ValidationError[] {
  const data = node.data as TriggerNodeData;
  const result = schema.safeParse(data?.config ?? {});

  if (result.success) {
    return [];
  }

  return result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "config";
    return `Trigger node ${node.id}: ${path}: ${issue.message}`;
  });
}

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
  new_token_listing: (node) => {
    const data = node.data as TriggerNodeData;
    const config = data?.config || {};
    const errors: ValidationError[] = [];

    if (config.source && config.source !== "birdeye") {
      errors.push(`Trigger node ${node.id}: Unsupported token listing source`);
    }

    if (
      config.pollIntervalSeconds !== undefined &&
      (!Number.isInteger(config.pollIntervalSeconds) || config.pollIntervalSeconds < 30)
    ) {
      errors.push(`Trigger node ${node.id}: Poll interval must be at least 30 seconds`);
    }

    if (
      config.limit !== undefined &&
      (!Number.isInteger(config.limit) || config.limit < 1 || config.limit > 20)
    ) {
      errors.push(`Trigger node ${node.id}: Listing fetch limit must be between 1 and 20`);
    }

    return errors;
  },
  webhook: (node) => validateTriggerConfigWithSchema(node, WebhookTriggerConfigSchema),
  x402_payment: (node) => validateTriggerConfigWithSchema(node, X402PaymentTriggerConfigSchema),
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
  telegram: (_node) => {
    return [];
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

  // Action nodes are no longer required — a workflow can be trigger -> notify
  // (or any composition the user wires up). When present, they still get
  // per-action-type config validation.
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
