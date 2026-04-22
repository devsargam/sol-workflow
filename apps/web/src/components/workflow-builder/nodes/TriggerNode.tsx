"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import {
  BanknoteIcon,
  CircleDollarSignIcon,
  ClockIcon,
  CodeIcon,
  FileTextIcon,
  ImageIcon,
  ZapIcon,
} from "lucide-react";
import { memo } from "react";
import type { TriggerNodeData } from "../types";
import { rowHandleStyle } from "./node-layout";

const TRIGGER_CONFIG: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  balance_change: { label: "Balance Change", Icon: CircleDollarSignIcon },
  token_receipt: { label: "Token Receipt", Icon: BanknoteIcon },
  nft_receipt: { label: "NFT Receipt", Icon: ImageIcon },
  transaction_status: { label: "Transaction Status", Icon: FileTextIcon },
  program_log: { label: "Program Log", Icon: CodeIcon },
  cron: { label: "Scheduled", Icon: ClockIcon },
};

const ACCENT = "#9945FF";

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as TriggerNodeData;
  const { label, Icon } = TRIGGER_CONFIG[nodeData.type || ""] ?? {
    label: "Trigger",
    Icon: ZapIcon,
  };

  const address = nodeData.config?.address;
  const schedule = nodeData.config?.schedule;

  const outputValue =
    address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : schedule || nodeData.type || "—";

  return (
    <div
      className={cn(
        "w-[250px] rounded-lg border bg-[var(--surface-2)] select-none",
        "border-[var(--node-border)]",
        selected && "border-[var(--brand)] shadow-[0_0_0_1px_var(--brand)]"
      )}
    >
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

      {/* Output row */}
      <OutputRow label="Output" value={outputValue} />

      {/* Single source handle aligned to the output row */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="sol-handle-right"
        style={rowHandleStyle(0)}
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";

// ─── Shared OutputRow ─────────────────────────────────────────

export function OutputRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center h-[29px] px-3 border-t border-[var(--node-border)] gap-2">
      <span className="text-sm text-[var(--text-secondary)] flex-1 capitalize truncate">
        {label}
      </span>
      <span className="text-sm text-[var(--text-muted)] truncate max-w-[100px]">
        {value || "—"}
      </span>
    </div>
  );
}
