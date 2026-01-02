import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import type {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  TriggerNodeData,
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
  executionPath: string[]; // Track which nodes were executed
}

interface NodeExecutor {
  execute(
    node: WorkflowNode,
    context: ExecutionContext
  ): Promise<{ success: boolean; output?: any; error?: string }>;
}

export class WorkflowEngine {
  private connection: Connection;
  private nodeExecutors: Map<string, NodeExecutor>;

  constructor(connection: Connection) {
    this.connection = connection;
    this.nodeExecutors = new Map();

    // Register node executors
    this.registerNodeExecutor(NodeType.TRIGGER, new TriggerNodeExecutor());
    this.registerNodeExecutor(NodeType.FILTER, new FilterNodeExecutor());
    this.registerNodeExecutor(NodeType.ACTION, new ActionNodeExecutor(connection));
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
    const triggerNodes = graph.nodes.filter((n) => n.type === NodeType.TRIGGER);

    if (triggerNodes.length === 0) {
      return {
        success: false,
        executionPath: context.executionPath,
        errors: ["No trigger nodes found in workflow"],
      };
    }

    // Execute from each trigger node (usually just one)
    for (const triggerNode of triggerNodes) {
      const result = await this.executeNode(triggerNode, graph, adjacencyList, context, errors);
      if (!result) {
        // Execution was stopped (e.g., by filter)
        break;
      }
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
    adjacencyList: Map<string, string[]>,
    context: ExecutionContext,
    errors: string[]
  ): Promise<boolean> {
    console.log(`Executing node: ${node.id} (${node.type})`);

    // Track execution
    context.executionPath.push(node.id);

    // Get the executor for this node type
    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      errors.push(`No executor registered for node type: ${node.type}`);
      return false;
    }

    // Execute the node
    const result = await executor.execute(node, context);

    if (!result.success) {
      errors.push(`Node ${node.id} failed: ${result.error || "Unknown error"}`);
      return false;
    }

    // Store output in context for downstream nodes
    if (result.output !== undefined) {
      context.variables.set(node.id, result.output);
    }

    // Special handling for filter nodes
    if (node.type === NodeType.FILTER && result.output === false) {
      console.log(`Filter node ${node.id} evaluated to false, stopping execution`);
      return false; // Stop execution if filter fails
    }

    // Execute downstream nodes
    const downstreamNodeIds = adjacencyList.get(node.id) || [];
    for (const downstreamNodeId of downstreamNodeIds) {
      const downstreamNode = graph.nodes.find((n) => n.id === downstreamNodeId);
      if (!downstreamNode) {
        errors.push(`Downstream node ${downstreamNodeId} not found`);
        continue;
      }

      const continueExecution = await this.executeNode(
        downstreamNode,
        graph,
        adjacencyList,
        context,
        errors
      );

      if (!continueExecution) {
        return false;
      }
    }

    return true;
  }

  /**
   * Build adjacency list from edges
   */
  private buildAdjacencyList(graph: WorkflowGraph): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    for (const edge of graph.edges) {
      const downstream = adjacencyList.get(edge.source) || [];
      downstream.push(edge.target);
      adjacencyList.set(edge.source, downstream);
    }

    return adjacencyList;
  }

  /**
   * Register a custom node executor
   */
  registerNodeExecutor(nodeType: string, executor: NodeExecutor) {
    this.nodeExecutors.set(nodeType, executor);
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

    const results = conditions.map((condition) =>
      this.evaluateCondition(condition, context.triggerData, context.variables)
    );

    const passed = logic === "and" ? results.every((r) => r) : results.some((r) => r);

    console.log(`Filter node ${node.id}: Result = ${passed}`);

    return {
      success: true,
      output: passed,
    };
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    triggerData: any,
    variables: Map<string, any>
  ): boolean {
    // Get the field value from trigger data or variables
    const fieldValue = this.getFieldValue(condition.field, triggerData, variables);
    const compareValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return fieldValue == compareValue;
      case "not_equals":
        return fieldValue != compareValue;
      case "greater_than":
        return Number(fieldValue) > Number(compareValue);
      case "less_than":
        return Number(fieldValue) < Number(compareValue);
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

  private getFieldValue(field: string, triggerData: any, variables: Map<string, any>): any {
    // Support nested field access with dot notation
    const parts = field.split(".");
    let value = triggerData;

    for (const part of parts) {
      if (part.startsWith("$")) {
        // Variable reference
        value = variables.get(part.slice(1));
      } else if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

/**
 * Action node executor - executes on-chain actions
 */
class ActionNodeExecutor implements NodeExecutor {
  constructor(private connection: Connection) {}

  async execute(node: WorkflowNode, context: ExecutionContext) {
    const data = node.data as ActionNodeData & { nodeType: NodeType.ACTION };

    console.log(`Action node ${node.id}: Executing ${data.actionType}`);

    try {
      let txSignature: string;

      switch (data.actionType) {
        case "send_sol":
          txSignature = await this.sendSol(data.config, context);
          break;
        case "send_spl_token":
          txSignature = await this.sendSplToken(data.config, context);
          break;
        case "call_program":
          txSignature = await this.callProgram(data.config, context);
          break;
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

  private async sendSol(config: any, context: ExecutionContext): Promise<string> {
    // TODO: Implement actual SOL transfer
    // This is a placeholder implementation
    console.log("Sending SOL:", config);

    // For now, return a mock signature
    return `mock_sol_tx_${Date.now()}`;
  }

  private async sendSplToken(config: any, context: ExecutionContext): Promise<string> {
    // TODO: Implement actual SPL token transfer
    console.log("Sending SPL token:", config);

    // For now, return a mock signature
    return `mock_token_tx_${Date.now()}`;
  }

  private async callProgram(config: any, context: ExecutionContext): Promise<string> {
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

    console.log(`Notify node ${node.id}: Sending ${data.notifyType} notification`);

    try {
      if (data.notifyType === "discord" && data.webhookUrl) {
        await this.sendDiscordNotification(data, context);
      } else if (data.notifyType === "telegram" && data.telegramBotToken && data.telegramChatId) {
        await this.sendTelegramNotification(data, context);
      } else if (data.notifyType === "webhook" && data.webhookUrl) {
        await this.sendWebhook(data, context);
      } else {
        console.warn(`Notification type ${data.notifyType} not yet implemented`);
      }

      return { success: true };
    } catch (error) {
      console.error(`Notify node ${node.id} failed:`, error);
      // Notifications are non-fatal
      return {
        success: true, // Don't fail the workflow for notification errors
        error: (error as Error).message,
      };
    }
  }

  private async sendDiscordNotification(
    data: NotifyNodeData & { nodeType: NodeType.NOTIFY },
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
    const triggerNode = workflow.graph?.nodes?.find((n: any) => n.type === NodeType.TRIGGER);
    const triggerType = triggerNode?.data?.triggerType || "unknown";

    const embed = getTemplate(data.template || "default", {
      workflowName: workflow.name,
      executionId: context.executionId,
      txSignature,
      status: txSignature ? "success" : "failed",
      triggerType,
      triggerData: context.triggerData,
    });

    await discordClient.sendEmbed(embed);
  }

  private async sendTelegramNotification(
    data: NotifyNodeData & { nodeType: NodeType.NOTIFY },
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

    const triggerNode = workflow.graph?.nodes?.find((n: any) => n.type === NodeType.TRIGGER);
    const triggerType = triggerNode?.data?.triggerType || "unknown";

    const template = getTelegramTemplate(data.template || "default", {
      workflowName: workflow.name,
      executionId: context.executionId,
      txSignature,
      status: txSignature ? "success" : "failed",
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
    data: NotifyNodeData & { nodeType: NodeType.NOTIFY },
    context: ExecutionContext
  ) {
    const response = await fetch(data.webhookUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflowId: context.workflowId,
        executionId: context.executionId,
        triggerData: context.triggerData,
        variables: Object.fromEntries(context.variables),
        executionPath: context.executionPath,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  }
}
