"use client";

import { MegaphoneIcon, RocketIcon, SearchIcon, ZapIcon } from "lucide-react";
import React from "react";

const nodeTypes = [
  {
    type: "trigger",
    label: "Trigger",
    description: "Start your workflow",
    icon: <ZapIcon className="text-2xl" />,
    color: "bg-blue-100 text-blue-600 border-blue-200",
  },
  {
    type: "filter",
    label: "Filter",
    description: "Add conditions",
    icon: <SearchIcon className="text-2xl" />,
    color: "bg-orange-100 text-orange-600 border-orange-200",
  },
  {
    type: "action",
    label: "Action",
    description: "Execute on-chain",
    icon: <RocketIcon className="text-2xl" />,
    color: "bg-purple-100 text-purple-600 border-purple-200",
  },
  {
    type: "notify",
    label: "Notify",
    description: "Send notifications",
    icon: <MegaphoneIcon className="text-2xl" />,
    color: "bg-green-100 text-green-600 border-green-200",
  },
];

export function Sidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-neutral-900">Workflow Nodes</h3>
        <p className="text-xs text-neutral-600">Drag and drop nodes to build your workflow</p>
      </div>

      <div className="space-y-2">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            className="flex gap-x-4 p-3 border-2 border-black rounded-sm items-center"
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            <span className="text-2xl">{node.icon}</span>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{node.label}</h4>
                <p className="text-xs opacity-80 mt-0.5">{node.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/*<div className="mt-8 p-4 bg-neutral-50 rounded-lg">
        <h4 className="text-xs font-semibold text-neutral-700 mb-2">Tips:</h4>
        <ul className="text-xs text-neutral-600 space-y-1">
          <li>• Connect nodes by dragging from handles</li>
          <li>• Click on a node to configure it</li>
          <li>• Use the minimap for navigation</li>
        </ul>
      </div>*/}
    </aside>
  );
}
