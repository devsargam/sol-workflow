"use client";

import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { FilterNodeData } from "../types";

export const FilterNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FilterNodeData;
  const conditionsCount = nodeData.conditions?.length || 0;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-orange-50 min-w-[180px] transition-all ${
        selected
          ? "border-orange-500 shadow-lg shadow-orange-100"
          : "border-orange-200 hover:border-orange-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#fb923c",
          width: 10,
          height: 10,
        }}
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🔍</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
            Filter
          </div>
          <div className="text-sm font-medium text-neutral-900">
            {conditionsCount > 0
              ? `${conditionsCount} Condition${conditionsCount > 1 ? "s" : ""}`
              : "No Conditions"}
          </div>
        </div>
      </div>

      {conditionsCount > 0 && (
        <div className="mt-2 pt-2 border-t border-orange-200">
          <div className="space-y-1">
            {nodeData.conditions?.slice(0, 2).map((condition: any, index: number) => (
              <div key={index} className="text-xs text-neutral-600">
                <span className="font-medium">{condition.field}</span>{" "}
                <span className="text-orange-600">{condition.operator}</span>{" "}
                <span className="font-mono">{condition.value}</span>
              </div>
            ))}
            {conditionsCount > 2 && (
              <div className="text-xs text-neutral-500">+{conditionsCount - 2} more...</div>
            )}
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#fb923c",
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});

FilterNode.displayName = "FilterNode";
