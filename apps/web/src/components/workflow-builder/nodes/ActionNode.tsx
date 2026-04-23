"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import {
  CodeIcon,
  CoinsIcon,
  MoneyIcon as BanknoteIcon,
  ProhibitIcon as CircleOffIcon,
  RocketIcon,
} from "@phosphor-icons/react";
import { memo } from "react";
import type { ActionNodeData } from "../types";
import { errorHandleStyle, rowHandleStyle } from "./node-layout";
import { OutputRow } from "./TriggerNode";

const ACTION_CONFIG: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  send_sol: { label: "Send SOL", Icon: BanknoteIcon },
  send_spl_token: { label: "Send Token", Icon: CoinsIcon },
  call_program: { label: "Call Program", Icon: CodeIcon },
  do_nothing: { label: "Do Nothing", Icon: CircleOffIcon },
};

const ACCENT = "#06B6D4";

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as ActionNodeData;
  const { label, Icon } = ACTION_CONFIG[nodeData.type || ""] ?? {
    label: "Action",
    Icon: RocketIcon,
  };

  const cfg = nodeData.config ?? {};
  const successValue =
    nodeData.type === "send_sol" && cfg.amount
      ? `${(cfg.amount / 1e9).toFixed(4)} SOL`
      : nodeData.type === "send_spl_token" && cfg.amount
      ? `${cfg.amount} tokens`
      : nodeData.type === "call_program" && cfg.programId
      ? `${cfg.programId.slice(0, 8)}...`
      : "—";

  return (
    <div
      className={cn(
        "w-[250px] rounded-lg border bg-[var(--surface-2)] select-none",
        "border-[var(--node-border)]",
        selected && "border-[var(--brand)] shadow-[0_0_0_1px_var(--brand)]"
      )}
    >
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
          <Icon className="h-[14px] w-[14px] text-white" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] truncate leading-none">
          {label}
        </span>
      </div>

      <OutputRow label="success" value={successValue} />
      <OutputRow label="error" />

      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="sol-handle-right"
        style={rowHandleStyle(0)}
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

ActionNode.displayName = "ActionNode";
