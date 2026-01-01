"use client";

import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { NotifyNodeData } from "../types";

export const NotifyNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as NotifyNodeData;
  const getNotifyIcon = (type: string) => {
    switch (type) {
      case "discord":
        return "💬";
      case "slack":
        return "📨";
      case "email":
        return "📧";
      case "webhook":
        return "🔔";
      default:
        return "📢";
    }
  };

  const getNotifyLabel = (type: string) => {
    switch (type) {
      case "discord":
        return "Discord";
      case "slack":
        return "Slack";
      case "email":
        return "Email";
      case "webhook":
        return "Webhook";
      default:
        return "Notify";
    }
  };

  const getTemplateLabel = (template: string) => {
    switch (template) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "minimal":
        return "Minimal";
      case "detailed":
        return "Detailed";
      default:
        return "Default";
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-green-50 min-w-[180px] transition-all ${
        selected
          ? "border-green-500 shadow-lg shadow-green-100"
          : "border-green-200 hover:border-green-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#22c55e",
          width: 10,
          height: 10,
        }}
      />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{getNotifyIcon(nodeData.type || "")}</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-green-600 uppercase tracking-wider">
            Notify
          </div>
          <div className="text-sm font-medium text-neutral-900">
            {getNotifyLabel(nodeData.type || "")}
          </div>
        </div>
      </div>

      {(nodeData.webhookUrl || nodeData.template) && (
        <div className="mt-2 pt-2 border-t border-green-200 space-y-1">
          {nodeData.template && (
            <div className="text-xs text-neutral-600">
              <span className="font-medium">Template:</span>{" "}
              <span className="text-green-600">{getTemplateLabel(nodeData.template || "")}</span>
            </div>
          )}
          {nodeData.webhookUrl && (
            <div className="text-xs text-neutral-600">
              <span className="font-medium">Webhook:</span>{" "}
              <span className="text-green-600">Configured</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotifyNode.displayName = "NotifyNode";
