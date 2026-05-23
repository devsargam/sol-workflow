import { isTriggerNode, type WorkflowNode, type NotifyNodeData } from "@repo/types";
import { NodeType } from "utils";
import { createDiscordClient, getTemplate } from "@repo/discord";
import { createTelegramClient, getTemplate as getTelegramTemplate } from "@repo/telegram";
import { db, workflows as workflowsTable, eq } from "@repo/db";
import type { ExecutionContext, NodeManifest, NodeExecutionResult } from "../node-registry";

interface SingleNotificationConfig {
  notifyType: string;
  webhookUrl?: string;
  webhookSecret?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
  telegramDisableWebPreview?: boolean;
  template?: string;
  customMessage?: string;
}

async function loadTriggerType(workflowId: string): Promise<{ workflowName: string; triggerType: string }> {
  const [workflow] = await db
    .select()
    .from(workflowsTable)
    .where(eq(workflowsTable.id, workflowId))
    .limit(1);

  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const graph = workflow.graph as any;
  const triggerNode = graph?.nodes?.find((n: any) => isTriggerNode(n));
  const triggerType = triggerNode?.data?.triggerType || "unknown";

  return { workflowName: workflow.name, triggerType };
}

async function sendDiscordNotification(
  data: { webhookUrl?: string; template?: string; customMessage?: string },
  context: ExecutionContext
): Promise<void> {
  const { workflowName, triggerType } = await loadTriggerType(context.workflowId);
  const discordClient = createDiscordClient(data.webhookUrl!);
  const txSignature = context.variables.get("txSignature");
  const executionStatus = context.hasErrors ? "failed" : "success";

  const embed = getTemplate(data.template || "default", {
    workflowName,
    executionId: context.executionId,
    txSignature,
    status: executionStatus,
    triggerType,
    triggerData: context.triggerData,
  });

  if (data.customMessage) {
    await discordClient.send({
      content: data.customMessage.substring(0, 2000),
      embeds: [embed],
    });
    return;
  }

  await discordClient.sendEmbed(embed);
}

async function sendTelegramNotification(
  data: {
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
    telegramDisableWebPreview?: boolean;
    template?: string;
    customMessage?: string;
  },
  context: ExecutionContext
): Promise<void> {
  const { workflowName, triggerType } = await loadTriggerType(context.workflowId);

  const botToken = data.telegramBotToken?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = data.telegramChatId?.trim() || process.env.TELEGRAM_DEFAULT_CHAT_ID?.trim();

  if (!botToken) {
    throw new Error("Telegram bot token is not configured on the notification or Dolphinflow server");
  }
  if (!chatId) {
    throw new Error("Telegram chat ID is not configured on the notification or Dolphinflow server");
  }

  const telegramClient = createTelegramClient(botToken);
  const txSignature = context.variables.get("txSignature");
  const executionStatus = context.hasErrors ? "failed" : "success";

  const template = getTelegramTemplate(data.template || "default", {
    workflowName,
    executionId: context.executionId,
    txSignature,
    status: executionStatus,
    triggerType,
    triggerData: context.triggerData,
    network: process.env.SOLANA_NETWORK || "devnet",
  });

  const customPrefix = data.customMessage ? `${data.customMessage}\n\n` : "";

  await telegramClient.sendMessage({
    chat_id: chatId,
    text: `${customPrefix}${template.text}`,
    parse_mode: data.telegramParseMode,
    disable_web_page_preview: data.telegramDisableWebPreview ?? template.disableWebPagePreview,
  });
}

function formatWebhookMessage(
  template: string,
  ctx: {
    workflowName: string;
    executionId: string;
    txSignature?: string;
    status: string;
    triggerType: string;
    triggerData?: any;
    variables?: Record<string, any>;
  }
): string {
  const statusEmoji = ctx.status === "success" ? "✅" : "❌";
  const statusText = ctx.status === "success" ? "Success" : "Failed";

  switch (template) {
    case "minimal":
      return `${statusEmoji} Workflow "${ctx.workflowName}" executed: ${statusText}`;

    case "success":
      return (
        `🎉 Workflow Executed Successfully\n\n` +
        `Workflow: ${ctx.workflowName}\n` +
        `Status: ✅ Success\n` +
        `Trigger: ${ctx.triggerType.replace("_", " ").toUpperCase()}\n` +
        `Execution ID: ${ctx.executionId}\n` +
        (ctx.txSignature ? `Transaction: https://solscan.io/tx/${ctx.txSignature}\n` : "")
      );

    case "error":
      return (
        `⚠️ Workflow Execution Failed\n\n` +
        `Workflow: ${ctx.workflowName}\n` +
        `Status: ❌ Failed\n` +
        `Trigger: ${ctx.triggerType.replace("_", " ").toUpperCase()}\n` +
        `Execution ID: ${ctx.executionId}`
      );

    case "detailed": {
      const lines = [
        `${statusEmoji} Workflow Execution Report`,
        "",
        `Workflow: ${ctx.workflowName}`,
        `Status: ${statusText}`,
        `Trigger: ${ctx.triggerType.replace("_", " ").toUpperCase()}`,
        `Execution ID: ${ctx.executionId}`,
      ];

      if (ctx.txSignature) {
        lines.push(`Transaction: https://solscan.io/tx/${ctx.txSignature}`);
      }

      if (ctx.triggerData) {
        lines.push("");
        lines.push("Trigger Data:");
        lines.push(JSON.stringify(ctx.triggerData, null, 2).substring(0, 1000));
      }

      if (ctx.variables && Object.keys(ctx.variables).length > 0) {
        lines.push("");
        lines.push("Variables:");
        lines.push(JSON.stringify(ctx.variables, null, 2).substring(0, 1000));
      }

      return lines.join("\n");
    }

    default:
      return (
        `${statusEmoji} Workflow "${ctx.workflowName}" executed\n\n` +
        `Status: ${statusText}\n` +
        `Execution ID: ${ctx.executionId}\n` +
        `Trigger: ${ctx.triggerType.replace("_", " ").toUpperCase()}` +
        (ctx.txSignature ? `\nTransaction: https://solscan.io/tx/${ctx.txSignature}` : "")
      );
  }
}

async function sendWebhook(
  data: { webhookUrl?: string; webhookSecret?: string; template?: string; customMessage?: string },
  context: ExecutionContext
): Promise<void> {
  const { workflowName, triggerType } = await loadTriggerType(context.workflowId);
  const txSignature = context.variables.get("txSignature");
  const executionStatus = context.hasErrors ? "failed" : "success";

  const formattedMessage = data.customMessage
    ? data.customMessage
    : formatWebhookMessage(data.template || "default", {
        workflowName,
        executionId: context.executionId,
        txSignature,
        status: executionStatus,
        triggerType,
        triggerData: context.triggerData,
        variables: Object.fromEntries(context.variables),
      });

  const payload = {
    workflowId: context.workflowId,
    workflowName,
    executionId: context.executionId,
    status: executionStatus,
    timestamp: new Date().toISOString(),
    triggerType,
    triggerData: context.triggerData,
    variables: Object.fromEntries(context.variables),
    executionPath: context.executionPath,
    hasErrors: context.hasErrors,
    ...(txSignature && { txSignature }),
    message: formattedMessage,
    template: data.template || "default",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "dolphinflow/1.0",
  };
  if (data.webhookSecret) {
    headers["X-Webhook-Secret"] = data.webhookSecret;
  }

  const maxRetries = 3;
  const baseDelay = 1000;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(data.webhookUrl!, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        console.log(`Webhook sent successfully (attempt ${attempt + 1})`);
        return;
      }

      const status = response.status;
      const isRetryable = status >= 500 || status === 429;

      if (!isRetryable || attempt === maxRetries) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Webhook failed: ${status} - ${errorText}`);
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `Webhook attempt ${attempt + 1} failed with ${status}, retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));

      const errorText = await response.text().catch(() => response.statusText);
      lastError = new Error(`Webhook failed: ${status} - ${errorText}`);
    } catch (error: any) {
      const isNetworkError =
        error.name === "AbortError" ||
        error.name === "TypeError" ||
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT";

      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `Webhook attempt ${attempt + 1} failed with network error, retrying in ${delay}ms...`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      lastError = error;
    }
  }

  if (lastError) throw lastError;
}

async function sendSingleNotification(
  config: SingleNotificationConfig,
  context: ExecutionContext,
  notificationId: string
): Promise<void> {
  try {
    if (config.notifyType === "discord" && config.webhookUrl) {
      await sendDiscordNotification(config, context);
    } else if (config.notifyType === "telegram") {
      await sendTelegramNotification(config, context);
    } else if (config.notifyType === "webhook" && config.webhookUrl) {
      await sendWebhook(
        {
          webhookUrl: config.webhookUrl,
          webhookSecret: config.webhookSecret,
          template: config.template,
          customMessage: config.customMessage,
        },
        context
      );
    } else {
      console.warn(
        `Notification ${notificationId}: Type ${config.notifyType} not yet implemented or missing required fields`
      );
    }
  } catch (error) {
    console.error(`Notification ${notificationId} failed:`, error);
  }
}

export const notifyManifest: NodeManifest = {
  type: NodeType.NOTIFY,
  kind: "node",

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const data = node.data as NotifyNodeData & { nodeType: NodeType.NOTIFY };

    try {
      if (data.notifications && data.notifications.length > 0) {
        console.log(`Notify node ${node.id}: Sending ${data.notifications.length} notification(s)`);

        const notificationPromises = data.notifications.map((notification: any, index: number) =>
          sendSingleNotification(notification, context, `${node.id}-${index}`)
        );

        await Promise.allSettled(notificationPromises);

        return { success: true, handle: "sent" };
      }

      if (data.notifyType) {
        console.log(`Notify node ${node.id}: Sending ${data.notifyType} notification`);
        await sendSingleNotification(
          {
            notifyType: data.notifyType,
            webhookUrl: data.webhookUrl,
            webhookSecret: data.webhookSecret,
            telegramBotToken: data.telegramBotToken,
            telegramChatId: data.telegramChatId,
            telegramParseMode: data.telegramParseMode,
            telegramDisableWebPreview: data.telegramDisableWebPreview,
            template: data.template,
            customMessage: data.customMessage,
          },
          context,
          node.id
        );
        return { success: true, handle: "sent" };
      }

      console.warn(`Notify node ${node.id}: No notification configuration found`);
      return { success: true, handle: "sent" };
    } catch (error) {
      console.error(`Notify node ${node.id} failed:`, error);
      return {
        success: true,
        error: (error as Error).message,
        handle: "sent",
      };
    }
  },

  scopeOutput(node, result) {
    const data = node.data as NotifyNodeData & { nodeType: NodeType.NOTIFY };
    const notificationCount = data.notifications?.length ?? (data.notifyType ? 1 : 0);

    return {
      output: result.output ?? null,
      success: result.success,
      error: result.error,
      notifyType: data.notifyType ?? null,
      notificationCount,
    };
  },
};
