import type { WorkflowNode } from "@repo/types";
import { NodeType } from "utils";
import type { ExecutionContext, NodeManifest, NodeExecutionResult } from "../node-registry";

export const triggerManifest: NodeManifest = {
  type: NodeType.TRIGGER,
  kind: "trigger",

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(`Trigger node ${node.id}: Processing trigger data`);

    return {
      success: true,
      output: context.triggerData,
      handle: "output",
    };
  },

  scopeOutput(_node, result) {
    return result.output ?? null;
  },
};
