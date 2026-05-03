import type { WorkflowNode, ActionNodeData } from "@repo/types";
import { NodeType } from "utils";
import type { ExecutionContext, NodeManifest, NodeExecutionResult } from "../node-registry";

async function sendSol(config: any): Promise<string> {
  console.log("Sending SOL:", config);
  return `mock_sol_tx_${Date.now()}`;
}

async function sendSplToken(config: any): Promise<string> {
  console.log("Sending SPL token:", config);
  return `mock_token_tx_${Date.now()}`;
}

async function callProgram(config: any): Promise<string> {
  console.log("Calling program:", config);
  return `mock_program_tx_${Date.now()}`;
}

export const actionManifest: NodeManifest = {
  type: NodeType.ACTION,
  kind: "node",

  async execute(node: WorkflowNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const data = node.data as ActionNodeData & { nodeType: NodeType.ACTION };

    console.log(`Action node ${node.id}: Executing ${data.actionType}`);

    try {
      let txSignature: string;

      switch (data.actionType) {
        case "send_sol":
          txSignature = await sendSol(data.config);
          break;
        case "send_spl_token":
          txSignature = await sendSplToken(data.config);
          break;
        case "call_program":
          txSignature = await callProgram(data.config);
          break;
        case "do_nothing":
          console.log(`Do Nothing action executed for node ${node.id}`);
          return { success: true, output: null, handle: "success" };
        default:
          return {
            success: false,
            error: `Unknown action type: ${data.actionType}`,
            handle: "error",
          };
      }

      context.variables.set("txSignature", txSignature);

      return {
        success: true,
        output: txSignature,
        handle: "success",
      };
    } catch (error) {
      console.error(`Action node ${node.id} failed:`, error);
      return {
        success: false,
        error: (error as Error).message,
        handle: "error",
      };
    }
  },

  scopeOutput(node, result) {
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
  },
};
