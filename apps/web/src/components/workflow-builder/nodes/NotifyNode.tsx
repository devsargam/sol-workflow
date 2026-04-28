"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { MegaphoneIcon } from "@phosphor-icons/react";
import { memo } from "react";
import type { NotifyNodeData } from "../types";
import { errorHandleStyle, rowHandleStyle } from "./node-layout";
import { OutputRow } from "./TriggerNode";

const ACCENT = "#10B981";

const CHANNEL_LABELS: Record<string, string> = {
  discord: "Discord",
  telegram: "Telegram",
  email: "Email",
  webhook: "Webhook",
};

export const NotifyNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as NotifyNodeData;

  const notifications = nodeData.notifications?.length
    ? nodeData.notifications
    : nodeData.notifyType
    ? [{ notifyType: nodeData.notifyType }]
    : [];

  const channelNames = notifications
    .map((n) => CHANNEL_LABELS[n.notifyType ?? ""] ?? n.notifyType)
    .filter(Boolean)
    .join(", ");

  const headerLabel =
    notifications.length === 1
      ? (CHANNEL_LABELS[notifications[0]?.notifyType ?? ""] ?? "Notify")
      : notifications.length > 1
      ? `Notify (${notifications.length})`
      : "Notify";

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
          <MegaphoneIcon className="h-[14px] w-[14px] text-white" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] truncate leading-none">
          {headerLabel}
        </span>
      </div>

      <OutputRow label="sent" value={channelNames || "—"} />
      <OutputRow label="error" />

      <Handle
        type="source"
        position={Position.Right}
        id="sent"
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

NotifyNode.displayName = "NotifyNode";
