import type {
  WorkflowGraph,
  WorkflowNode,
  FilterNodeData,
  ActionNodeData,
  NotifyNodeData,
} from "@repo/types";
import { createDiscordClient, getTemplate } from "@repo/discord";
import { createTelegramClient, getTemplate as getTelegramTemplate } from "@repo/telegram";
import { NodeType } from "utils";
import { db, workflows as workflowsTable, eq } from "@repo/db";

interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggerData: any;
  variables: Map<string, any>; // For passing data between nodes
  stepOutputs: Record<string, any>;
  workflowVariables: Record<string, any>;
  executionPath: string[]; // Track which nodes were executed
  hasErrors: boolean; // Track if any errors occurred during execution
}

interface NodeExecutor {
  execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: any; error?: string }>;
}

export class WorkflowEngine {
  private nodeExecutors: Map<string, NodeExecutor>;

  constructor() {
    this.nodeExecutors = new Map();

    // Register node executors
    this.registerNodeExecutor(NodeType.TRIGGER, new TriggerNodeExecutor());
    this.registerNodeExecutor(NodeType.FILTER, new FilterNodeExecutor());
    this.registerNodeExecutor(NodeType.ACTION, new ActionNodeExecutor());
    this.registerNodeExecutor(NodeType.NOTIFY, new NotifyNodeExecutor());
  }

  /**
   * Execute a workflow graph
   */
  async execute(
    graph: WorkflowGraph,
    context: ExecutionContext
  ): Promise<{
    success: boolean;
    executionPath: string[];
    errors: string[];
  }> {
    const errors: string[] = [];

    // Build adjacency list for graph traversal
    const adjacencyList = this.buildAdjacencyList(graph);

    // Find all trigger nodes (entry points)
    const triggerNodes = graph.nodes.filter((n: WorkflowNode) => n.type === NodeType.TRIGGER);

    if (triggerNodes.length === 0) {
      return {
        success: false,
        executionPath: context.executionPath,
        errors: ["No trigger nodes found in workflow"],
      };
    }

    // Execute from each trigger node (usually just one)
    for (const triggerNode of triggerNodes) {
      await this.executeNode(triggerNode, graph, adjacencyList, context, errors);
    }

    return {
      success: errors.length === 0,
      executionPath: context.executionPath,
      errors,
    };
  }

  /**
   * Execute a single node and its downstream nodes
   */
  private async executeNode(
    node: WorkflowNode,
    graph: WorkflowGraph,
    adjacencyList: Map<string, Map<string, string[]>>,
    context: ExecutionContext,
    errors: string[]
  ): Promise<boolean> {
    console.log(`Executing node: ${node.id} (${node.type})`);

    context.executionPath.push(node.id);

    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      errors.push(`No executor registered for node type: ${node.type}`);
      return false;
    }

    const result = await executor.execute(node, context);

    const scopedOutput = this.buildScopedOutput(node, result);
    if (scopedOutput !== undefined) {
      context.variables.set(node.id, scopedOutput);
      context.stepOutputs[node.id] = scopedOutput;

      if (node.type === NodeType.TRIGGER) {
        context.variables.set("trigger", scopedOutput);
      }
    }

    // Determine which output handle to follow based on node type and result
    let outHandle: string;

    if (node.type === NodeType.FILTER) {
      if (!result.success) {
        outHandle = "error";
        context.hasErrors = true;
        errors.push(`Filter node ${node.id} errored: ${result.error || "Unknown error"}`);
      } else if (result.output === true) {
        outHandle = "if";
      } else {
        outHandle = "else";
      }
    } else if (node.type === NodeType.ACTION) {
      if (!result.success) {
        outHandle = "error";
        context.hasErrors = true;
        errors.push(`Action node ${node.id} failed: ${result.error || "Unknown error"}`);
      } else {
        outHandle = "success";
      }
    } else if (node.type === NodeType.TRIGGER) {
      if (!result.success) {
        errors.push(`Trigger node ${node.id} failed: ${result.error || "Unknown error"}`);
        return false;
      }
      outHandle = "output";
    } else if (node.type === NodeType.NOTIFY) {
      outHandle = result.success ? "sent" : "error";
    } else {
      outHandle = "_default";
    }

    const downstreamNodeIds = this.getDownstreamIds(adjacencyList, node.id, outHandle);

    for (const downstreamNodeId of downstreamNodeIds) {
      const downstreamNode = graph.nodes.find((n: WorkflowNode) => n.id === downstreamNodeId);
      if (!downstreamNode) {
        errors.push(`Downstream node ${downstreamNodeId} not found`);
        continue;
      }

      await this.executeNode(downstreamNode, graph, adjacencyList, context, errors);
    }

    return true;
  }

  /**
   * Build adjacency list keyed by source node + handle.
   * Map layout: sourceNodeId → handleId → targetNodeIds[]
   * Edges without a sourceHandle are stored under "_default".
   */
  private buildAdjacencyList(graph: WorkflowGraph): Map<string, Map<string, string[]>> {
    const adjacencyList = new Map<string, Map<string, string[]>>();

    for (const edge of graph.edges) {
      if (!adjacencyList.has(edge.source)) {
        adjacencyList.set(edge.source, new Map());
      }
      const handleMap = adjacencyList.get(edge.source)!;
      const handle = (edge as any).sourceHandle || "_default";
      const targets = handleMap.get(handle) || [];
      targets.push(edge.target);
      handleMap.set(handle, targets);
    }

    return adjacencyList;
  }

  private getDownstreamIds(
    adjacencyList: Map<string, Map<string, string[]>>,
    nodeId: string,
    handle: string
  ): string[] {
    const handleMap = adjacencyList.get(nodeId);
    if (!handleMap) return [];
    return handleMap.get(handle) || handleMap.get("_default") || [];
  }

  /**
   * Register a custom node executor
   */
  registerNodeExecutor(nodeType: string, executor: NodeExecutor) {
    this.nodeExecutors.set(nodeType, executor);
  }

  private buildScopedOutput(
    node: WorkflowNode,
    result: { success: boolean; output?: any; error?: string }
  ): any {
    switch (node.type) {
      case NodeType.TRIGGER:
        return result.output ?? null;
      case NodeType.FILTER: {
        const data = node.data as FilterNodeData & { nodeType: NodeType.FILTER };
        return {
          output: result.output,
          passed: result.output === true,
          logic: data.logic || "and",
          conditions: data.conditions || [],
        };
      }
      case NodeType.ACTION: {
        const data = node.data as ActionNodeData & { nodeType: NodeType.ACTION };
        const txSignature =
          typeof result.output === "string" ? result.output : result.output?.txSignature;

        return {
          output: result.output ?? null,
          success: result.success,
          error: result.error,
          actionType: data.actionType,
          txSignature: txSignature ?? null,
          config: data.config || {},
        };
      }
      case NodeType.NOTIFY: {
        const data = node.data as NotifyNodeData & { nodeType: NodeType.NOTIFY };
        const notificationCount = data.notifications?.length ?? (data.notifyType ? 1 : 0);

        return {
          output: result.output ?? null,
          success: result.success,
          error: result.error,
          notifyType: data.notifyType ?? null,
          notificationCount,
        };
      }
      default:
        return result.output;
    }
  }
}

/**
 * Trigger node executor - validates trigger data
 */
class TriggerNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext) {
    console.log(`Trigger node ${node.id}: Processing trigger data`);

    // Trigger nodes just validate that we have the expected trigger data
    // The actual trigger event comes from the listener

    return {
      success: true,
      output: context.triggerData,
    };
  }
}

/**
 * Filter node executor - evaluates filter conditions
 */
class FilterNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const data = node.data as FilterNodeData & { nodeType: NodeType.FILTER };
    const conditions = data.conditions || [];
    const logic = data.logic || "and";

    console.log(
      `Filter node ${node.id}: Evaluating ${conditions.length} conditions with ${logic} logic`
    );

    if (conditions.length === 0) {
      // No conditions means pass through
      return { success: true, output: true };
    }

    const results = conditions.map((condition: any) => this.evaluateCondition(condition, context));

    const passed =
      logic === "and" ? results.every((r: boolean) => r) : results.some((r: boolean) => r);

    console.log(`Filter node ${node.id}: Result = ${passed}`);

    return {
      success: true,
      output: passed,
    };
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value?: any },
    context: ExecutionContext
  ): boolean {
    // Get the field value from trigger data or variables
    const fieldValue = this.getFieldValue(condition.field, context);
    const compareValue = condition.value;

    switch (condition.operator) {
      case "equals":
      case "==":
        return fieldValue == compareValue;
      case "not_equals":
      case "!=":
        return fieldValue != compareValue;
      case "greater_than":
      case ">":
        return Number(fieldValue) > Number(compareValue);
      case "greater_than_or_equal":
      case ">=":
        return Number(fieldValue) >= Number(compareValue);
      case "less_than":
      case "<":
        return Number(fieldValue) < Number(compareValue);
      case "less_than_or_equal":
      case "<=":
        return Number(fieldValue) <= Number(compareValue);
      case "contains":
        return String(fieldValue).includes(String(compareValue));
      case "starts_with":
        return String(fieldValue).startsWith(String(compareValue));
      case "ends_with":
        return String(fieldValue).endsWith(String(compareValue));
      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private getFieldValue(field: string, context: ExecutionContext): any {
    const normalizedField = this.normalizeReference(field);
    if (!normalizedField) return undefined;

    if (normalizedField.startsWith("$")) {
      return this.resolveVariableReference(normalizedField.slice(1), context);
    }

    const parts = normalizedField.split(".").filter(Boolean);
    if (parts.length === 0) return undefined;
    const rootPart = parts[0];
    if (!rootPart) return undefined;

    if (rootPart === "trigger") {
      return this.resolvePath(context.triggerData, parts.slice(1));
    }

    if (rootPart === "workflow") {
      return this.resolvePath(context.workflowVariables, parts.slice(1));
    }

    if (rootPart === "steps") {
      const [, stepId, ...rest] = parts;
      if (!stepId) return context.stepOutputs;
      return this.resolvePath(context.stepOutputs[stepId], rest);
    }

    if (rootPart in context.stepOutputs) {
      return this.resolvePath(context.stepOutputs[rootPart], parts.slice(1));
    }

    const fromTriggerData = this.resolvePath(context.triggerData, parts);
    if (fromTriggerData !== undefined) {
      return fromTriggerData;
    }

    return this.resolveVariableReference(normalizedField, context);
  }

  private normalizeReference(field: string): string {
    const trimmed = field.trim();

    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
      return trimmed.slice(1, -1).trim();
    }

    return trimmed;
  }

  private resolveVariableReference(reference: string, context: ExecutionContext): any {
    const parts = reference.split(".").filter(Boolean);
    if (parts.length === 0) return undefined;

    const [rootKey, ...rest] = parts;
    if (!rootKey) return undefined;

    if (rootKey === "trigger") {
      return this.resolvePath(context.triggerData, rest);
    }

    if (rootKey === "workflow") {
      return this.resolvePath(context.workflowVariables, rest);
    }

    if (rootKey === "steps") {
      const [stepId, ...stepRest] = rest;
      if (!stepId) return context.stepOutputs;
      return this.resolvePath(context.stepOutputs[stepId], stepRest);
    }

    const rootValue = context.variables.get(rootKey);
    return this.resolvePath(rootValue, rest);
  }

  private resolvePath(value: any, parts: string[]): any {
    let currentValue = value;

    for (const part of parts) {
      if (currentValue && typeof currentValue === "object") {
        currentValue = currentValue[part];
      } else {
        return undefined;
      }
    }

    return currentValue;
  }
}

/**
 * Action node executor - executes on-chain actions
 */
class ActionNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const data = node.data as ActionNodeData & { nodeType: NodeType.ACTION };

    console.log(`Action node ${node.id}: Executing ${data.actionType}`);

    try {
      let txSignature: string;

      switch (data.actionType) {
        case "send_sol":
          txSignature = await this.sendSol(data.config);
          break;
        case "send_spl_token":
          txSignature = await this.sendSplToken(data.config);
          break;
        case "call_program":
          txSignature = await this.callProgram(data.config);
          break;
        case "do_nothing":
          console.log(`Do Nothing action executed for node ${node.id}`);
          return { success: true, output: null };
        default:
          return {
            success: false,
            error: `Unknown action type: ${data.actionType}`,
          };
      }

      context.variables.set("txSignature", txSignature);

      return {
        success: true,
        output: txSignature,
      };
    } catch (error) {
      console.error(`Action node ${node.id} failed:`, error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async sendSol(config: any): Promise<string> {
    // TODO: Implement actual SOL transfer
    // This is a placeholder implementation
    console.log("Sending SOL:", config);

    // For now, return a mock signature
    return `mock_sol_tx_${Date.now()}`;
  }

  private async sendSplToken(config: any): Promise<string> {
    // TODO: Implement actual SPL token transfer
    console.log("Sending SPL token:", config);

    // For now, return a mock signature
    return `mock_token_tx_${Date.now()}`;
  }

  private async callProgram(config: any): Promise<string> {
    // TODO: Implement actual program call
    console.log("Calling program:", config);

    // For now, return a mock signature
    return `mock_program_tx_${Date.now()}`;
  }
}

/**
 * Notify node executor - sends notifications
 */
class NotifyNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const data = node.data as NotifyNodeData & { nodeType: NodeType.NOTIFY };

    try {
      if (data.notifications && data.notifications.length > 0) {
        console.log(`Notify node ${node.id}: Sending ${data.notifications.length} notification(s)`);

        const notificationPromises = data.notifications.map((notification: any, index: number) =>
          this.sendSingleNotification(notification, context, `${node.id}-${index}`)
        );

        await Promise.allSettled(notificationPromises);

        return { success: true };
      } else if (data.notifyType) {
        console.log(`Notify node ${node.id}: Sending ${data.notifyType} notification`);
        await this.sendSingleNotification(
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
        return { success: true };
      } else {
        console.warn(`Notify node ${node.id}: No notification configuration found`);
        return { success: true }; // Non-fatal
      }
    } catch (error) {
      console.error(`Notify node ${node.id} failed:`, error);
      return {
        success: true,
        error: (error as Error).message,
      };
    }
  }

  private async sendSingleNotification(
    notificationConfig: {
      notifyType: string;
      webhookUrl?: string;
      webhookSecret?: string;
      telegramBotToken?: string;
      telegramChatId?: string;
      telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
      telegramDisableWebPreview?: boolean;
      template?: string;
      customMessage?: string;
    },
    context: ExecutionContext,
    notificationId: string
  ): Promise<void> {
    try {
      if (notificationConfig.notifyType === "discord" && notificationConfig.webhookUrl) {
        await this.sendDiscordNotification(notificationConfig, context);
      } else if (
        notificationConfig.notifyType === "telegram" &&
        notificationConfig.telegramBotToken &&
        notificationConfig.telegramChatId
      ) {
        await this.sendTelegramNotification(notificationConfig, context);
      } else if (notificationConfig.notifyType === "webhook" && notificationConfig.webhookUrl) {
        await this.sendWebhook(
          {
            webhookUrl: notificationConfig.webhookUrl,
            webhookSecret: notificationConfig.webhookSecret,
            template: notificationConfig.template,
            customMessage: notificationConfig.customMessage,
          },
          context
        );
      } else {
        console.warn(
          `Notification ${notificationId}: Type ${notificationConfig.notifyType} not yet implemented or missing required fields`
        );
      }
    } catch (error) {
      console.error(`Notification ${notificationId} failed:`, error);
    }
  }

  private async sendDiscordNotification(
    data: {
      webhookUrl?: string;
      template?: string;
      customMessage?: string;
    },
    context: ExecutionContext
  ) {
    // Fetch workflow details to get the name
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, context.workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow ${context.workflowId} not found`);
    }

    const discordClient = createDiscordClient(data.webhookUrl!);
    const txSignature = context.variables.get("txSignature");

    // Extract trigger type from the graph
    const graph = workflow.graph as any;
    const triggerNode = graph?.nodes?.find((n: any) => n.type === NodeType.TRIGGER);
    const triggerType = triggerNode?.data?.triggerType || "unknown";

    const executionStatus = context.hasErrors ? "failed" : "success";

    const embed = getTemplate(data.template || "default", {
      workflowName: workflow.name,
      executionId: context.executionId,
      txSignature,
      status: executionStatus,
      triggerType,
      triggerData: context.triggerData,
    });

    await discordClient.sendEmbed(embed);
  }

  private async sendTelegramNotification(
    data: {
      telegramBotToken?: string;
      telegramChatId?: string;
      telegramParseMode?: "Markdown" | "MarkdownV2" | "HTML";
      telegramDisableWebPreview?: boolean;
      template?: string;
      customMessage?: string;
    },
    context: ExecutionContext
  ) {
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, context.workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow ${context.workflowId} not found`);
    }

    const telegramClient = createTelegramClient(data.telegramBotToken!);
    const txSignature = context.variables.get("txSignature");

    // Extract trigger type from the graph
    const graph = workflow.graph as any;
    const triggerNode = graph?.nodes?.find((n: any) => n.type === NodeType.TRIGGER);
    const triggerType = triggerNode?.data?.triggerType || "unknown";

    const executionStatus = context.hasErrors ? "failed" : "success";

    const template = getTelegramTemplate(data.template || "default", {
      workflowName: workflow.name,
      executionId: context.executionId,
      txSignature,
      status: executionStatus,
      triggerType,
      triggerData: context.triggerData,
      network: process.env.SOLANA_NETWORK || "devnet",
    });

    const customPrefix = data.customMessage ? `${data.customMessage}\n\n` : "";

    await telegramClient.sendMessage({
      chat_id: data.telegramChatId!,
      text: `${customPrefix}${template.text}`,
      parse_mode: data.telegramParseMode,
      disable_web_page_preview: data.telegramDisableWebPreview ?? template.disableWebPagePreview,
    });
  }

  private async sendWebhook(
    data: {
      webhookUrl?: string;
      webhookSecret?: string;
      template?: string;
      customMessage?: string;
    },
    context: ExecutionContext
  ) {
    const [workflow] = await db
      .select()
      .from(workflowsTable)
      .where(eq(workflowsTable.id, context.workflowId))
      .limit(1);

    if (!workflow) {
      throw new Error(`Workflow ${context.workflowId} not found`);
    }

    const txSignature = context.variables.get("txSignature");

    const graph = workflow.graph as any;
    const triggerNode = graph?.nodes?.find((n: any) => n.type === NodeType.TRIGGER);
    const triggerType = triggerNode?.data?.triggerType || "unknown";

    const executionStatus = context.hasErrors ? "failed" : "success";

    let formattedMessage = "";
    if (data.customMessage) {
      formattedMessage = data.customMessage;
    } else {
      formattedMessage = this.formatWebhookMessage(data.template || "default", {
        workflowName: workflow.name,
        executionId: context.executionId,
        txSignature,
        status: executionStatus,
        triggerType,
        triggerData: context.triggerData,
        variables: Object.fromEntries(context.variables),
      });
    }

    const payload = {
      workflowId: context.workflowId,
      workflowName: workflow.name,
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

    // Build headers with optional secret
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "dolphinflow/1.0",
    };

    // Add secret header if provided
    if (data.webhookSecret) {
      headers["X-Webhook-Secret"] = data.webhookSecret;
    }

    // Retry configuration
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    let lastError: Error | null = null;

    // Exponential backoff retry loop
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(data.webhookUrl!, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          console.log(`Webhook sent successfully (attempt ${attempt + 1})`);
          return; // Success, exit retry loop
        }

        // Check if it's a retryable error (5xx or network errors)
        const status = response.status;
        const isRetryable = status >= 500 || status === 429; // Server errors or rate limit

        if (!isRetryable || attempt === maxRetries) {
          // Client error (4xx) or final attempt - don't retry
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Webhook failed: ${status} - ${errorText}`);
        }

        // Calculate exponential backoff delay: baseDelay * 2^attempt
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Webhook attempt ${attempt + 1} failed with ${status}, retrying in ${delay}ms...`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Update last error for final throw if all retries fail
        const errorText = await response.text().catch(() => response.statusText);
        lastError = new Error(`Webhook failed: ${status} - ${errorText}`);
      } catch (error: any) {
        // Handle network errors, timeouts, etc.
        const isNetworkError =
          error.name === "AbortError" ||
          error.name === "TypeError" ||
          error.code === "ECONNREFUSED" ||
          error.code === "ETIMEDOUT";

        if (!isNetworkError || attempt === maxRetries) {
          // Non-retryable error or final attempt
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Webhook attempt ${attempt + 1} failed with network error, retrying in ${delay}ms...`,
          error.message
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
        lastError = error;
      }
    }

    // If we exhausted all retries, throw the last error
    if (lastError) {
      throw lastError;
    }
  }

  private formatWebhookMessage(
    template: string,
    context: {
      workflowName: string;
      executionId: string;
      txSignature?: string;
      status: string;
      triggerType: string;
      triggerData?: any;
      variables?: Record<string, any>;
    }
  ): string {
    const statusEmoji = context.status === "success" ? "✅" : "❌";
    const statusText = context.status === "success" ? "Success" : "Failed";

    switch (template) {
      case "minimal":
        return `${statusEmoji} Workflow "${context.workflowName}" executed: ${statusText}`;

      case "success":
        return (
          `🎉 Workflow Executed Successfully\n\n` +
          `Workflow: ${context.workflowName}\n` +
          `Status: ✅ Success\n` +
          `Trigger: ${context.triggerType.replace("_", " ").toUpperCase()}\n` +
          `Execution ID: ${context.executionId}\n` +
          (context.txSignature ? `Transaction: https://solscan.io/tx/${context.txSignature}\n` : "")
        );

      case "error":
        return (
          `⚠️ Workflow Execution Failed\n\n` +
          `Workflow: ${context.workflowName}\n` +
          `Status: ❌ Failed\n` +
          `Trigger: ${context.triggerType.replace("_", " ").toUpperCase()}\n` +
          `Execution ID: ${context.executionId}`
        );

      case "detailed":
        const lines = [
          `${statusEmoji} Workflow Execution Report`,
          "",
          `Workflow: ${context.workflowName}`,
          `Status: ${statusText}`,
          `Trigger: ${context.triggerType.replace("_", " ").toUpperCase()}`,
          `Execution ID: ${context.executionId}`,
        ];

        if (context.txSignature) {
          lines.push(`Transaction: https://solscan.io/tx/${context.txSignature}`);
        }

        if (context.triggerData) {
          lines.push("");
          lines.push("Trigger Data:");
          lines.push(JSON.stringify(context.triggerData, null, 2).substring(0, 1000));
        }

        if (context.variables && Object.keys(context.variables).length > 0) {
          lines.push("");
          lines.push("Variables:");
          lines.push(JSON.stringify(context.variables, null, 2).substring(0, 1000));
        }

        return lines.join("\n");

      default:
        return (
          `${statusEmoji} Workflow "${context.workflowName}" executed\n\n` +
          `Status: ${statusText}\n` +
          `Execution ID: ${context.executionId}\n` +
          `Trigger: ${context.triggerType.replace("_", " ").toUpperCase()}` +
          (context.txSignature ? `\nTransaction: https://solscan.io/tx/${context.txSignature}` : "")
        );
    }
  }
}
