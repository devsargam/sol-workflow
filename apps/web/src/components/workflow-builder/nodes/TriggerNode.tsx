"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { getTriggerIcon } from "../icons";
import type { TriggerNodeData } from "../types";

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as TriggerNodeData;

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
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white min-w-[180px] transition-all border-black",
        selected && "shadow-lg"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{getTriggerIcon(nodeData.type)}</span>
        <div className="flex-1">
          <div className="text-base font-semibold text-black">
            {getTriggerLabel(nodeData.type || "")}
          </div>
        </div>
      </div>

      {nodeData.config?.address && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-medium">Address:</span>
            <div className="font-mono text-[10px] mt-0.5 truncate">{nodeData.config.address}</div>
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

TriggerNode.displayName = "TriggerNode";
