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
      value: context.triggerType.replace("_", " ").toUpperCase(),
      inline: true,
    },
  ];

  if (context.txSignature) {
    fields.push({
      name: "Transaction",
      value: `[View on Solscan](https://solscan.io/tx/${context.txSignature})`,
      inline: false,
    });
  }

  return {
    title: "🎉 Workflow Executed Successfully",
    description: `Execution ID: \`${context.executionId}\``,
    color: COLORS.SUCCESS,
    fields,
    footer: {
      text: "Sol Workflow",
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
      value: context.triggerType.replace("_", " ").toUpperCase(),
      inline: true,
    },
  ];

  if (context.error) {
    fields.push({
      name: "Error",
      value: `\`\`\`${context.error.substring(0, 500)}\`\`\``,
      inline: false,
    });
  }

  return {
    title: "⚠️ Workflow Execution Failed",
    description: `Execution ID: \`${context.executionId}\``,
    color: COLORS.ERROR,
    fields,
    footer: {
      text: "Sol Workflow",
    },
    timestamp: new Date().toISOString(),
  };
}

export function getMinimalTemplate(context: TemplateContext): DiscordEmbed {
  return {
    description: `Workflow **${context.workflowName}** executed ${context.status === "success" ? "✅" : "❌"}`,
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
      value: context.triggerType.replace("_", " ").toUpperCase(),
      inline: true,
    },
  ];

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
    description: `Execution ID: \`${context.executionId}\``,
    color: context.status === "success" ? COLORS.SUCCESS : COLORS.ERROR,
    fields,
    footer: {
      text: "Sol Workflow",
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
