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
  triggerNodeId?: string;
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

type NodeExecutionResult = { success: boolean; output?: any; error?: string };

interface DagEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
}

interface CompiledWorkflowDag {
  nodes: Map<string, WorkflowNode>;
  outgoing: Map<string, DagEdge[]>;
  incoming: Map<string, DagEdge[]>;
  triggerNodeIds: string[];
}

interface DagExecutionState {
  completed: Set<string>;
  running: Set<string>;
  activatedEdges: Set<string>;
  skippedEdges: Set<string>;
  skippedNodes: Set<string>;
  errors: string[];
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
    const dag = this.compileDag(graph);

    if (dag.triggerNodeIds.length === 0) {
      return {
        success: false,
        executionPath: context.executionPath,
        errors: ["No trigger nodes found in workflow"],
      };
    }

    const cycleErrors = this.validateAcyclic(dag);
    if (cycleErrors.length > 0) {
      return {
        success: false,
        executionPath: context.executionPath,
        errors: cycleErrors,
      };
    }

    const entryNodeIds = this.resolveEntryNodeIds(dag, context);
    if (entryNodeIds.length === 0) {
      return {
        success: false,
        executionPath: context.executionPath,
        errors: [`Trigger node ${context.triggerNodeId} was not found in workflow graph`],
      };
    }

    const state: DagExecutionState = {
      completed: new Set(),
      running: new Set(),
      activatedEdges: new Set(),
      skippedEdges: new Set(),
      skippedNodes: new Set(),
      errors: [],
    };

    this.skipInactiveTriggers(dag, entryNodeIds, state);
    await this.executeDag(dag, context, state);

    return {
      success: state.errors.length === 0,
      executionPath: context.executionPath,
      errors: state.errors,
    };
  }

  private resolveEntryNodeIds(dag: CompiledWorkflowDag, context: ExecutionContext): string[] {
    if (!context.triggerNodeId) {
      return dag.triggerNodeIds;
    }

    return dag.triggerNodeIds.includes(context.triggerNodeId) ? [context.triggerNodeId] : [];
  }

  private skipInactiveTriggers(
    dag: CompiledWorkflowDag,
    entryNodeIds: string[],
    state: DagExecutionState
  ): void {
    const entryNodeIdSet = new Set(entryNodeIds);

    for (const triggerNodeId of dag.triggerNodeIds) {
      if (entryNodeIdSet.has(triggerNodeId)) {
        continue;
      }

      state.skippedNodes.add(triggerNodeId);

      for (const edge of dag.outgoing.get(triggerNodeId) ?? []) {
        state.skippedEdges.add(edge.id);
      }
    }
  }

  private compileDag(graph: WorkflowGraph): CompiledWorkflowDag {
    const nodes = new Map<string, WorkflowNode>();
    const outgoing = new Map<string, DagEdge[]>();
    const incoming = new Map<string, DagEdge[]>();
    const triggerNodeIds: string[] = [];

    for (const node of graph.nodes) {
      nodes.set(node.id, node);
      outgoing.set(node.id, []);
      incoming.set(node.id, []);

      if (node.type === NodeType.TRIGGER) {
        triggerNodeIds.push(node.id);
      }
    }

    for (const edge of graph.edges) {
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);

      if (!sourceNode || !targetNode) {
        continue;
      }

      const dagEdge: DagEdge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || "_default",
      };

      outgoing.get(sourceNode.id)!.push(dagEdge);
      incoming.get(targetNode.id)!.push(dagEdge);
    }

    return {
      nodes,
      outgoing,
      incoming,
      triggerNodeIds,
    };
  }

  private validateAcyclic(dag: CompiledWorkflowDag): string[] {
    const indegree = new Map<string, number>();

    for (const nodeId of dag.nodes.keys()) {
      indegree.set(nodeId, dag.incoming.get(nodeId)?.length ?? 0);
    }

    const ready = Array.from(indegree.entries())
      .filter(([, degree]) => degree === 0)
      .map(([nodeId]) => nodeId);
    let visited = 0;

    while (ready.length > 0) {
      const nodeId = ready.shift()!;
      visited++;

      for (const edge of dag.outgoing.get(nodeId) ?? []) {
        const nextDegree = (indegree.get(edge.target) ?? 0) - 1;
        indegree.set(edge.target, nextDegree);
        if (nextDegree === 0) {
          ready.push(edge.target);
        }
      }
    }

    if (visited === dag.nodes.size) {
      return [];
    }

    const cyclicNodeIds = Array.from(indegree.entries())
      .filter(([, degree]) => degree > 0)
      .map(([nodeId]) => nodeId);

    return [
      `Workflow graph must be a DAG. Cycle detected around node(s): ${cyclicNodeIds.join(", ")}`,
    ];
  }

  private async executeDag(
    dag: CompiledWorkflowDag,
    context: ExecutionContext,
    state: DagExecutionState
  ): Promise<void> {
    while (true) {
      this.markUnreachableNodes(dag, state);

      const readyNodes = this.getReadyNodes(dag, state);
      if (readyNodes.length === 0) {
        break;
      }

      for (const node of readyNodes) {
        state.running.add(node.id);
      }

      await Promise.all(
        readyNodes.map(async (node) => {
          await this.executeDagNode(node, dag, context, state);
        })
      );
    }

    this.markUnreachableNodes(dag, state);

    const blockedNodes = Array.from(dag.nodes.values()).filter(
      (node) =>
        !state.completed.has(node.id) &&
        !state.running.has(node.id) &&
        !state.skippedNodes.has(node.id)
    );

    if (blockedNodes.length > 0) {
      state.errors.push(
        `Workflow DAG stalled with unresolved node(s): ${blockedNodes.map((node) => node.id).join(", ")}`
      );
    }
  }

  private getReadyNodes(dag: CompiledWorkflowDag, state: DagExecutionState): WorkflowNode[] {
    const readyNodes: WorkflowNode[] = [];

    for (const node of dag.nodes.values()) {
      if (
        state.completed.has(node.id) ||
        state.running.has(node.id) ||
        state.skippedNodes.has(node.id)
      ) {
        continue;
      }

      if (node.type === NodeType.TRIGGER) {
        readyNodes.push(node);
        continue;
      }

      const incomingEdges = dag.incoming.get(node.id) ?? [];
      const hasActivatedInput = incomingEdges.some((edge) => state.activatedEdges.has(edge.id));
      const allInputsResolved = incomingEdges.every((edge) => this.isEdgeResolved(edge, state));

      if (incomingEdges.length > 0 && hasActivatedInput && allInputsResolved) {
        readyNodes.push(node);
      }
    }

    return readyNodes;
  }

  private markUnreachableNodes(dag: CompiledWorkflowDag, state: DagExecutionState): void {
    let changed = true;

    while (changed) {
      changed = false;

      for (const node of dag.nodes.values()) {
        if (
          node.type === NodeType.TRIGGER ||
          state.completed.has(node.id) ||
          state.running.has(node.id) ||
          state.skippedNodes.has(node.id)
        ) {
          continue;
        }

        const incomingEdges = dag.incoming.get(node.id) ?? [];
        const hasActivatedInput = incomingEdges.some((edge) => state.activatedEdges.has(edge.id));
        const allInputsResolved = incomingEdges.every((edge) => this.isEdgeResolved(edge, state));

        if (incomingEdges.length > 0 && !hasActivatedInput && allInputsResolved) {
          state.skippedNodes.add(node.id);

          for (const edge of dag.outgoing.get(node.id) ?? []) {
            state.skippedEdges.add(edge.id);
          }

          changed = true;
        }
      }
    }
  }

  private async executeDagNode(
    node: WorkflowNode,
    dag: CompiledWorkflowDag,
    context: ExecutionContext,
    state: DagExecutionState
  ): Promise<void> {
    console.log(`Executing DAG node: ${node.id} (${node.type})`);
    context.executionPath.push(node.id);

    const executor = this.nodeExecutors.get(node.type);
    if (!executor) {
      state.errors.push(`No executor registered for node type: ${node.type}`);
      this.activateOutgoingEdges(node, dag, state, "error");
      state.running.delete(node.id);
      state.completed.add(node.id);
      return;
    }

    const result = await executor.execute(node, context);
    this.storeNodeOutput(node, result, context);

    const outHandle = this.resolveOutputHandle(node, result, context, state.errors);
    this.activateOutgoingEdges(node, dag, state, outHandle);

    state.running.delete(node.id);
    state.completed.add(node.id);
  }

  private storeNodeOutput(
    node: WorkflowNode,
    result: NodeExecutionResult,
    context: ExecutionContext
  ): void {
    const scopedOutput = this.buildScopedOutput(node, result);
    if (scopedOutput === undefined) {
      return;
    }

    context.variables.set(node.id, scopedOutput);
    context.stepOutputs[node.id] = scopedOutput;

    if (node.type === NodeType.TRIGGER) {
      context.variables.set("trigger", scopedOutput);
    }
  }

  private resolveOutputHandle(
    node: WorkflowNode,
    result: NodeExecutionResult,
    context: ExecutionContext,
    errors: string[]
  ): string {
    if (node.type === NodeType.FILTER) {
      if (!result.success) {
        context.hasErrors = true;
        errors.push(`Filter node ${node.id} errored: ${result.error || "Unknown error"}`);
        return "error";
      }

      return result.output === true ? "if" : "else";
    }

    if (node.type === NodeType.ACTION) {
      if (!result.success) {
        context.hasErrors = true;
        errors.push(`Action node ${node.id} failed: ${result.error || "Unknown error"}`);
        return "error";
      }

      return "success";
    }

    if (node.type === NodeType.TRIGGER) {
      if (!result.success) {
        context.hasErrors = true;
        errors.push(`Trigger node ${node.id} failed: ${result.error || "Unknown error"}`);
        return "error";
      }

      return "output";
    }

    if (node.type === NodeType.NOTIFY) {
      return result.success ? "sent" : "error";
    }

    return "_default";
  }

  private isEdgeResolved(edge: DagEdge, state: DagExecutionState): boolean {
    if (state.skippedEdges.has(edge.id)) {
      return true;
    }

    return state.activatedEdges.has(edge.id) && state.completed.has(edge.source);
  }

  private activateOutgoingEdges(
    node: WorkflowNode,
    dag: CompiledWorkflowDag,
    state: DagExecutionState,
    outHandle: string
  ): void {
    const outgoingEdges = dag.outgoing.get(node.id) ?? [];

    for (const edge of outgoingEdges) {
      if (edge.sourceHandle === outHandle || edge.sourceHandle === "_default") {
        state.activatedEdges.add(edge.id);
      } else {
        state.skippedEdges.add(edge.id);
      }
    }
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
      } else if (notificationConfig.notifyType === "telegram") {
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
      chat_id: chatId,
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
