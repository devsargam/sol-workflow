"use client";

import { cn } from "@/lib/utils";
import { Handle, NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import { getNotificationIcon } from "../icons";
import type { NotifyNodeData } from "../types";

export const NotifyNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as NotifyNodeData;

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

  const notifications = nodeData.notifications || [];
  const isMultipleMode = notifications.length > 0;
  const displayNotifications = isMultipleMode
    ? notifications
    : nodeData.notifyType || nodeData.type
      ? [
          {
            notifyType: nodeData.notifyType || nodeData.type || "",
            webhookUrl: nodeData.webhookUrl,
            telegramBotToken: nodeData.telegramBotToken,
            telegramChatId: nodeData.telegramChatId,
            telegramParseMode: nodeData.telegramParseMode,
            telegramDisableWebPreview: nodeData.telegramDisableWebPreview,
            template: nodeData.template,
            customMessage: nodeData.customMessage,
          },
        ]
      : [];

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

      {displayNotifications.length === 0 ? (
        <div className="text-base font-semibold text-black">Notify</div>
      ) : displayNotifications.length === 1 ? (
        <>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">
              {getNotificationIcon(displayNotifications[0]?.notifyType || "")}
            </span>
            <div className="flex-1">
              <div className="text-base font-semibold text-black">
                {getNotifyLabel(displayNotifications[0]?.notifyType || "")}
              </div>
            </div>
          </div>

          {(nodeData.webhookUrl || nodeData.template || displayNotifications[0]?.template) && (
            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
              {(nodeData.template || displayNotifications[0]?.template) && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Template:</span>{" "}
                  <span className="text-gray-900">
                    {getTemplateLabel(nodeData.template || displayNotifications[0]?.template || "")}
                  </span>
                </div>
              )}
              {(nodeData.webhookUrl ||
                nodeData.telegramChatId ||
                displayNotifications[0]?.webhookUrl ||
                displayNotifications[0]?.telegramChatId) && (
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Destination:</span>{" "}
                  <span className="text-gray-900">Configured</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="text-base font-semibold text-black mb-2">
            Notify ({displayNotifications.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displayNotifications.map((notif: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded text-xs"
              >
                <span className="text-sm">{getNotificationIcon(notif.notifyType || "")}</span>
                <span className="text-gray-700">{getNotifyLabel(notif.notifyType || "")}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

NotifyNode.displayName = "NotifyNode";
