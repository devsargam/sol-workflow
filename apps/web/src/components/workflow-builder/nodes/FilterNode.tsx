"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { FadersHorizontalIcon as SlidersHorizontalIcon } from "@phosphor-icons/react";
import { memo } from "react";
import type { FilterNodeData } from "../types";
import { errorHandleStyle, rowHandleStyle } from "./node-layout";
import { OutputRow } from "./TriggerNode";

const ACCENT = "#F97316";

export const FilterNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as FilterNodeData;
  const conditions = nodeData.conditions ?? [];
  const title =
    nodeData.label || (nodeData.preset === "copy_wallet" ? "Copy-wallet filter" : "Condition");

  const ifValue =
    conditions[0]
      ? `${conditions[0].field} ${conditions[0].operator} ${conditions[0].value}`
      : "—";

  return (
    <div
      className={cn(
        "w-[250px] rounded-lg border bg-[var(--surface-2)] select-none",
        "border-[var(--node-border)]",
        selected && "border-[var(--brand)] shadow-[0_0_0_1px_var(--brand)]"
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="sol-handle-left"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div
          className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: ACCENT }}
        >
          <SlidersHorizontalIcon className="h-[14px] w-[14px] text-white" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] truncate leading-none">
          {title}
        </span>
        {conditions.length > 0 && (
          <span className="ml-auto text-xs text-[var(--text-muted)] flex-shrink-0">
            {conditions.length} rule{conditions.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* If row */}
      <OutputRow label="if" value={ifValue} />
      {/* Else row */}
      <OutputRow label="else" />
      {/* Error row */}
      <OutputRow label="error" />

      {/* Per-row source handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="if"
        className="sol-handle-right"
        style={rowHandleStyle(0)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="else"
        className="sol-handle-right"
        style={rowHandleStyle(1)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        className="sol-handle-right sol-handle-error"
        style={errorHandleStyle}
      />
    </div>
  );
});

FilterNode.displayName = "FilterNode";
