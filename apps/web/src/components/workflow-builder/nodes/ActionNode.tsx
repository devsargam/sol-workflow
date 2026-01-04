"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { getActionIcon } from "../icons";
import type { ActionNodeData } from "../types";

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ActionNodeData;

  const getActionLabel = (type: string) => {
    switch (type) {
      case "send_sol":
        return "Send SOL";
      case "send_spl_token":
        return "Send Token";
      case "call_program":
        return "Call Program";
      case "do_nothing":
        return "Do Nothing";
      default:
        return "Action";
    }
  };

  const getActionDetails = (type: string, config: any) => {
    switch (type) {
      case "send_sol":
        if (config?.amount) {
          const solAmount = (config.amount / 1e9).toFixed(6);
          return `${solAmount} SOL`;
        }
        break;
      case "send_spl_token":
        if (config?.amount) {
          return `${config.amount} tokens`;
        }
        break;
      case "call_program":
        if (config?.programId) {
          return `${config.programId.slice(0, 8)}...`;
        }
        break;
    }
    return null;
  };

  const actionDetails = getActionDetails(nodeData.type || "", nodeData.config);

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white min-w-[180px] transition-all border-black",
        selected && "shadow-lg"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#000000",
          width: 10,
          height: 10,
        }}
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{getActionIcon(nodeData.type)}</span>
        <div className="flex-1">
          <div className="text-base font-semibold text-black">
            {getActionLabel(nodeData.type || "")}
          </div>
        </div>
      </div>

      {actionDetails && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Amount:</span>{" "}
            <span className="font-mono">{actionDetails}</span>
          </div>
        </div>
      )}

      {nodeData.config?.toAddress && (
        <div className="mt-1">
          <div className="text-xs text-gray-600">
            <span className="font-medium">To:</span>
            <div className="font-mono text-[10px] mt-0.5 truncate">{nodeData.config.toAddress}</div>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#000000",
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";
