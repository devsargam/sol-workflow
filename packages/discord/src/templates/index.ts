import { DiscordEmbed } from "../client";

export interface TemplateContext {
  workflowName: string;
  executionId: string;
  txSignature?: string;
  status: string;
  triggerType: string;
  triggerData?: Record<string, any>;
  error?: string;
}

// Color constants (decimal values)
const COLORS = {
  SUCCESS: 5763719, // #58F287 (green)
  ERROR: 15548997, // #ED4245 (red)
  INFO: 5793266, // #5865F2 (blue)
  WARNING: 16776960, // #FFFF00 (yellow)
};

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function formatTriggerType(triggerType: string): string {
  return triggerType.replace(/_/g, " ").toUpperCase();
}

function formatPreview(value: unknown, maxLength = 900): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const formatted = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (!formatted) {
    return null;
  }

  return truncate(formatted, maxLength);
}

function getTriggerMetadataFields(
  context: TemplateContext
): Array<{ name: string; value: string; inline?: boolean }> {
  const triggerData = context.triggerData ?? {};
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: "Execution",
      value: `\`${context.executionId}\``,
      inline: false,
    },
  ];

  if (triggerData.firedAt) {
    fields.push({
      name: "Fired At",
      value: String(triggerData.firedAt),
      inline: true,
    });
  }

  if (triggerData.method || triggerData.path || triggerData.requestId) {
    const requestLines = [
      triggerData.method || triggerData.path
        ? [triggerData.method, triggerData.path].filter(Boolean).join(" ")
        : null,
      triggerData.requestId ? `Request ID: ${triggerData.requestId}` : null,
      triggerData.webhookId ? `Webhook ID: ${triggerData.webhookId}` : null,
    ].filter(Boolean);

    fields.push({
      name: "Request",
      value: requestLines.join("\n"),
      inline: false,
    });
  }

  const bodyPreview =
    formatPreview(triggerData.body) ??
    formatPreview(triggerData.input) ??
    formatPreview(triggerData.rawBody);

  if (bodyPreview) {
    fields.push({
      name: "Body",
      value: `\`\`\`json\n${bodyPreview}\n\`\`\``,
      inline: false,
    });
  }

  return fields;
}

export function getSuccessTemplate(context: TemplateContext): DiscordEmbed {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: "Workflow",
      value: context.workflowName,
      inline: true,
    },
    {
      name: "Status",
      value: "✅ Success",
      inline: true,
    },
    {
      name: "Trigger",
      value: formatTriggerType(context.triggerType),
      inline: true,
    },
  ];

  fields.push(...getTriggerMetadataFields(context));

  if (context.txSignature) {
    fields.push({
      name: "Transaction",
      value: `[View on Solscan](https://solscan.io/tx/${context.txSignature})`,
      inline: false,
    });
  }

  return {
    title: "🎉 Workflow Executed Successfully",
    description: `Workflow **${context.workflowName}** completed successfully.`,
    color: COLORS.SUCCESS,
    fields,
    footer: {
      text: "dolphinflow",
    },
    timestamp: new Date().toISOString(),
  };
}

export function getErrorTemplate(context: TemplateContext): DiscordEmbed {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: "Workflow",
      value: context.workflowName,
      inline: true,
    },
    {
      name: "Status",
      value: "❌ Failed",
      inline: true,
    },
    {
      name: "Trigger",
      value: formatTriggerType(context.triggerType),
      inline: true,
    },
  ];

  fields.push(...getTriggerMetadataFields(context));

  if (context.error) {
    fields.push({
      name: "Error",
      value: `\`\`\`${context.error.substring(0, 500)}\`\`\``,
      inline: false,
    });
  }

  return {
    title: "⚠️ Workflow Execution Failed",
    description: `Workflow **${context.workflowName}** failed during execution.`,
    color: COLORS.ERROR,
    fields,
    footer: {
      text: "dolphinflow",
    },
    timestamp: new Date().toISOString(),
  };
}

export function getMinimalTemplate(context: TemplateContext): DiscordEmbed {
  return {
    description:
      `Workflow **${context.workflowName}** executed ${context.status === "success" ? "✅" : "❌"}\n` +
      `Execution: \`${context.executionId}\``,
    color: context.status === "success" ? COLORS.SUCCESS : COLORS.ERROR,
    timestamp: new Date().toISOString(),
  };
}

export function getDetailedTemplate(context: TemplateContext): DiscordEmbed {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: "Workflow",
      value: context.workflowName,
      inline: true,
    },
    {
      name: "Status",
      value: context.status === "success" ? "✅ Success" : "❌ Failed",
      inline: true,
    },
    {
      name: "Trigger",
      value: formatTriggerType(context.triggerType),
      inline: true,
    },
  ];

  fields.push(...getTriggerMetadataFields(context));

  if (context.txSignature) {
    fields.push({
      name: "Transaction",
      value: `[View on Solscan](https://solscan.io/tx/${context.txSignature})`,
      inline: false,
    });
  }

  if (context.triggerData) {
    fields.push({
      name: "Trigger Data",
      value: `\`\`\`json\n${JSON.stringify(context.triggerData, null, 2).substring(0, 500)}\`\`\``,
      inline: false,
    });
  }

  if (context.error) {
    fields.push({
      name: "Error",
      value: `\`\`\`${context.error.substring(0, 500)}\`\`\``,
      inline: false,
    });
  }

  return {
    title: context.status === "success" ? "🎉 Workflow Executed" : "⚠️ Workflow Failed",
    description: `Workflow **${context.workflowName}** execution report.`,
    color: context.status === "success" ? COLORS.SUCCESS : COLORS.ERROR,
    fields,
    footer: {
      text: "dolphinflow",
    },
    timestamp: new Date().toISOString(),
  };
}

export function getDefaultTemplate(context: TemplateContext): DiscordEmbed {
  return context.status === "success" ? getSuccessTemplate(context) : getErrorTemplate(context);
}

// Template factory
export function getTemplate(templateName: string, context: TemplateContext): DiscordEmbed {
  switch (templateName) {
    case "success":
      return getSuccessTemplate(context);
    case "error":
      return getErrorTemplate(context);
    case "minimal":
      return getMinimalTemplate(context);
    case "detailed":
      return getDetailedTemplate(context);
    default:
      return getDefaultTemplate(context);
  }
}
