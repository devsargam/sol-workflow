"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { SearchIcon } from "lucide-react";
import { memo } from "react";
import type { FilterNodeData } from "../types";

export const FilterNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FilterNodeData;
  const conditionsCount = nodeData.conditions?.length || 0;

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
        <span className="text-xl">
          <SearchIcon className="w-6 h-6" />
        </span>
        <div className="flex-1">
          <div className="text-base font-semibold text-black">
            Filter
            {conditionsCount > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                {conditionsCount} condition{conditionsCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {conditionsCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="space-y-1">
            {nodeData.conditions?.slice(0, 2).map((condition: any, index: number) => (
              <div key={index} className="text-xs text-gray-600">
                <span className="font-medium">{condition.field}</span>{" "}
                <span className="text-gray-900">{condition.operator}</span>{" "}
                <span className="font-mono">{condition.value}</span>
              </div>
            ))}
            {conditionsCount > 2 && (
              <div className="text-xs text-gray-500">+{conditionsCount - 2} more...</div>
            )}
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

FilterNode.displayName = "FilterNode";
