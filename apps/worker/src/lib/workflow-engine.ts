import type { WorkflowGraph, WorkflowNode } from "@repo/types";
import {
  NodeRegistry,
  type ExecutionContext,
  type NodeExecutionResult,
} from "./node-registry";
import { createDefaultRegistry } from "./node-types";

export type { ExecutionContext, NodeExecutionResult } from "./node-registry";
export { NodeRegistry } from "./node-registry";

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
  private registry: NodeRegistry;

  constructor(registry: NodeRegistry = createDefaultRegistry()) {
    this.registry = registry;
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

  /**
   * Register a custom node manifest at runtime.
   */
  registerNode(manifest: Parameters<NodeRegistry["register"]>[0]): void {
    this.registry.register(manifest);
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

      if (this.registry.isTrigger(node.type)) {
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

      // Triggers are entry nodes — they have no upstream dependencies.
      if (this.registry.isTrigger(node.type)) {
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
          this.registry.isTrigger(node.type) ||
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

    const manifest = this.registry.get(node.type);
    if (!manifest) {
      state.errors.push(`No manifest registered for node type: ${node.type}`);
      this.activateOutgoingEdges(node, dag, state, "error");
      state.running.delete(node.id);
      state.completed.add(node.id);
      return;
    }

    let result: NodeExecutionResult;
    try {
      result = await manifest.execute(node, context);
    } catch (error) {
      const message = (error as Error).message ?? String(error);
      console.error(`Node ${node.id} (${node.type}) threw:`, error);
      state.errors.push(`Node ${node.id} (${node.type}) threw: ${message}`);
      context.hasErrors = true;
      this.activateOutgoingEdges(node, dag, state, "error");
      state.running.delete(node.id);
      state.completed.add(node.id);
      return;
    }

    this.storeNodeOutput(node, manifest, result, context);

    if (!result.success) {
      context.hasErrors = true;
      const errorMessage = result.error || "Unknown error";
      state.errors.push(`Node ${node.id} (${node.type}) failed: ${errorMessage}`);
    }

    const outHandle = result.handle ?? "_default";
    this.activateOutgoingEdges(node, dag, state, outHandle);

    state.running.delete(node.id);
    state.completed.add(node.id);
  }

  private storeNodeOutput(
    node: WorkflowNode,
    manifest: ReturnType<NodeRegistry["get"]> & {},
    result: NodeExecutionResult,
    context: ExecutionContext
  ): void {
    const scopedOutput = manifest.scopeOutput
      ? manifest.scopeOutput(node, result)
      : (result.output ?? null);

    if (scopedOutput === undefined) {
      return;
    }

    context.variables.set(node.id, scopedOutput);
    context.stepOutputs[node.id] = scopedOutput;

    if (this.registry.isTrigger(node.type)) {
      context.variables.set("trigger", scopedOutput);
    }
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
}
