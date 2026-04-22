"use client";

import {
  BanknoteIcon,
  MegaphoneIcon,
  SlidersHorizontalIcon,
  ZapIcon,
} from "lucide-react";
import React from "react";

const NODE_TYPES = [
  {
    type: "trigger",
    label: "Trigger",
    description: "React to on-chain events",
    Icon: ZapIcon,
    accent: "#9945FF",
  },
  {
    type: "filter",
    label: "Filter",
    description: "Apply conditions",
    Icon: SlidersHorizontalIcon,
    accent: "#F97316",
  },
  {
    type: "action",
    label: "Action",
    description: "Execute on-chain",
    Icon: BanknoteIcon,
    accent: "#06B6D4",
  },
  {
    type: "notify",
    label: "Notify",
    description: "Send notifications",
    Icon: MegaphoneIcon,
    accent: "#10B981",
  },
];

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside
      className="w-56 flex flex-col border-r py-4 px-3 gap-1"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      <div className="px-1 mb-3">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          Nodes
        </h3>
      </div>

      {NODE_TYPES.map(({ type, label, description, Icon, accent }) => (
        <div
          key={type}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors duration-100 hover:bg-[var(--surface-2)]"
          style={{ borderColor: "var(--node-border)" }}
          draggable
          onDragStart={(e) => onDragStart(e, type)}
        >
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: accent }}
          >
            <Icon className="h-[14px] w-[14px] text-white" />
          </div>
          <div className="min-w-0">
            <div
              className="text-sm font-medium leading-none"
              style={{ color: "var(--text-primary)" }}
            >
              {label}
            </div>
            <div
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}
