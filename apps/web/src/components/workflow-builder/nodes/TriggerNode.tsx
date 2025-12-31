"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "balance_change":
        return "💰";
      case "token_receipt":
        return "🪙";
      case "nft_receipt":
        return "🖼️";
      case "transaction_status":
        return "📊";
      case "program_log":
        return "📝";
      default:
        return "⚡";
    }
  };

  const getTriggerLabel = (type: string) => {
    switch (type) {
      case "balance_change":
        return "Balance Change";
      case "token_receipt":
        return "Token Receipt";
      case "nft_receipt":
        return "NFT Receipt";
      case "transaction_status":
        return "Transaction Status";
      case "program_log":
        return "Program Log";
      default:
        return "Trigger";
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-blue-50 min-w-[180px] transition-all ${
        selected
          ? "border-blue-500 shadow-lg shadow-blue-100"
          : "border-blue-200 hover:border-blue-300"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{getTriggerIcon(data.type)}</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Trigger
          </div>
          <div className="text-sm font-medium text-neutral-900">
            {getTriggerLabel(data.type)}
          </div>
        </div>
      </div>

      {data.config?.address && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <div className="text-xs text-neutral-600">
            <span className="font-medium">Address:</span>
            <div className="font-mono text-[10px] mt-0.5 truncate">
              {data.config.address}
            </div>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#3b82f6",
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});