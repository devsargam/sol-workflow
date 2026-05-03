import type { WorkflowNode } from "@repo/types";

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggerNodeId?: string;
  triggerData: any;
  variables: Map<string, any>;
  stepOutputs: Record<string, any>;
  workflowVariables: Record<string, any>;
  executionPath: string[];
  hasErrors: boolean;
}

export interface NodeExecutionResult {
  success: boolean;
  output?: any;
  handle?: string;
  error?: string;
}

export type NodeKind = "trigger" | "node";

export interface NodeManifest {
  type: string;
  kind: NodeKind;
  execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult>;
  scopeOutput?(node: WorkflowNode, result: NodeExecutionResult): unknown;
}

export class NodeRegistry {
  private manifests = new Map<string, NodeManifest>();

  register(manifest: NodeManifest): void {
    this.manifests.set(manifest.type, manifest);
  }

  get(type: string): NodeManifest | undefined {
    return this.manifests.get(type);
  }

  isTrigger(type: string): boolean {
    return this.manifests.get(type)?.kind === "trigger";
  }

  triggerTypes(): Set<string> {
    const types = new Set<string>();
    for (const manifest of this.manifests.values()) {
      if (manifest.kind === "trigger") types.add(manifest.type);
    }
    return types;
  }
}
