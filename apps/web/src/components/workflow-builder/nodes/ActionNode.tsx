"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import type { ActionNodeData } from "../types";

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ActionNodeData;
  const getActionIcon = (type: string) => {
    switch (type) {
      case "send_sol":
        return "💸";
      case "send_spl_token":
        return "🪙";
      case "call_program":
        return "📋";
      default:
        return "🚀";
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "send_sol":
        return "Send SOL";
      case "send_spl_token":
        return "Send Token";
      case "call_program":
        return "Call Program";
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
      className={`px-4 py-3 rounded-lg border-2 bg-purple-50 min-w-[180px] transition-all ${
        selected
          ? "border-purple-500 shadow-lg shadow-purple-100"
          : "border-purple-200 hover:border-purple-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#a855f7",
          width: 10,
          height: 10,
        }}
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{getActionIcon(nodeData.type || "")}</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
            Action
          </div>
          <div className="text-sm font-medium text-neutral-900">
            {getActionLabel(nodeData.type || "")}
          </div>
        </div>
      </div>

      {actionDetails && (
        <div className="mt-2 pt-2 border-t border-purple-200">
          <div className="text-xs text-neutral-600">
            <span className="font-medium">Amount:</span>{" "}
            <span className="font-mono">{actionDetails}</span>
          </div>
        </div>
      )}

      {nodeData.config?.toAddress && (
        <div className="mt-1">
          <div className="text-xs text-neutral-600">
            <span className="font-medium">To:</span>
            <div className="font-mono text-[10px] mt-0.5 truncate">
              {nodeData.config.toAddress}
            </div>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#a855f7",
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});