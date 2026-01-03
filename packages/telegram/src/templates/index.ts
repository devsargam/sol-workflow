import { getSolscanTxUrl } from "utils";
import type { TelegramParseMode } from "../client";

export interface TemplateContext {
  workflowName: string;
  executionId: string;
  txSignature?: string;
  status: string;
  triggerType: string;
  triggerData?: Record<string, any>;
  error?: string;
  network?: string;
}

export interface TelegramMessageTemplate {
  text: string;
  parseMode?: TelegramParseMode;
  disableWebPagePreview?: boolean;
}

function truncate(str: string, maxLen: number) {
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

function formatHeader(context: TemplateContext) {
  return `Sol Workflow\nWorkflow: ${context.workflowName}\nExecution: ${context.executionId}`;
}

export function getSuccessTemplate(context: TemplateContext): TelegramMessageTemplate {
  const lines: string[] = [];
  lines.push(formatHeader(context));
  lines.push(`Status: ✅ Success`);
  lines.push(`Trigger: ${context.triggerType}`);

  if (context.txSignature) {
    lines.push(`Transaction: ${getSolscanTxUrl(context.txSignature, context.network)}`);
  }

  return { text: lines.join("\n"), disableWebPagePreview: true };
}

export function getErrorTemplate(context: TemplateContext): TelegramMessageTemplate {
  const lines: string[] = [];
  lines.push(formatHeader(context));
  lines.push(`Status: ❌ Failed`);
  lines.push(`Trigger: ${context.triggerType}`);

  if (context.error) {
    lines.push(`Error: ${truncate(context.error, 600)}`);
  }

  return { text: lines.join("\n"), disableWebPagePreview: true };
}

export function getMinimalTemplate(context: TemplateContext): TelegramMessageTemplate {
  const status = context.status === "success" ? "✅" : "❌";
  return { text: `Workflow ${context.workflowName} executed ${status}` };
}

export function getDetailedTemplate(context: TemplateContext): TelegramMessageTemplate {
  const lines: string[] = [];
  lines.push(formatHeader(context));
  lines.push(`Status: ${context.status === "success" ? "✅ Success" : "❌ Failed"}`);
  lines.push(`Trigger: ${context.triggerType}`);

  if (context.txSignature) {
    lines.push(`Transaction: ${getSolscanTxUrl(context.txSignature, context.network)}`);
  }

  if (context.triggerData) {
    lines.push(`Trigger Data:\n${truncate(JSON.stringify(context.triggerData, null, 2), 800)}`);
  }

  if (context.error) {
    lines.push(`Error: ${truncate(context.error, 600)}`);
  }

  return { text: lines.join("\n"), disableWebPagePreview: true };
}

export function getDefaultTemplate(context: TemplateContext): TelegramMessageTemplate {
  return context.status === "success" ? getSuccessTemplate(context) : getErrorTemplate(context);
}

export function getTemplate(
  templateName: string,
  context: TemplateContext
): TelegramMessageTemplate {
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
