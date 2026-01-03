"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { MegaphoneIcon } from "lucide-react";
import { memo } from "react";
import type { NotifyNodeData } from "../types";

export const NotifyNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as NotifyNodeData;
  const getNotifyIcon = (type: string) => {
    switch (type) {
      case "discord":
        return "💬";
      case "telegram":
        return "✈️";
      case "slack":
        return "📨";
      case "email":
        return "📧";
      case "webhook":
        return "🔔";
      default:
        return <MegaphoneIcon className="w-6 h-6" />;
    }
  };

  const getNotifyLabel = (type: string) => {
    switch (type) {
      case "discord":
        return "Discord";
      case "telegram":
        return "Telegram";
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
        <span className="text-xl">{getNotifyIcon(nodeData.type || "")}</span>
        <div className="flex-1">
          <div className="text-base font-semibold text-black">
            {getNotifyLabel(nodeData.type || "")}
          </div>
        </div>
      </div>

      {(nodeData.webhookUrl || nodeData.template) && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
          {nodeData.template && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Template:</span>{" "}
              <span className="text-gray-900">{getTemplateLabel(nodeData.template || "")}</span>
            </div>
          )}
          {(nodeData.webhookUrl || nodeData.telegramChatId) && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Destination:</span>{" "}
              <span className="text-gray-900">Configured</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

NotifyNode.displayName = "NotifyNode";
