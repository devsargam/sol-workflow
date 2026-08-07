"use client";

import { useCallback, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TriggerNode } from "./nodes/TriggerNode";
import { FilterNode } from "./nodes/FilterNode";
import { ActionNode } from "./nodes/ActionNode";
import { NotifyNode } from "./nodes/NotifyNode";
import { RightPanel } from "./RightPanel";

const nodeTypes = {
  trigger: TriggerNode,
  filter: FilterNode,
  action: ActionNode,
  notify: NotifyNode,
};

const DEFAULT_EDGE_STYLE = { stroke: "var(--edge-color)", strokeWidth: 1.5 };

const initialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 80, y: 260 },
    data: { label: "Trigger", type: "balance_change", config: {} },
  },
  {
    id: "filter-1",
    type: "filter",
    position: { x: 460, y: 260 },
    data: { label: "Condition", conditions: [] },
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 840, y: 260 },
    data: { label: "Action", type: "send_sol", config: {} },
  },
  {
    id: "notify-1",
    type: "notify",
    position: { x: 1220, y: 260 },
    data: { label: "Notify", notifyType: "discord", template: "default" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "trigger-1",
    sourceHandle: "output",
    target: "filter-1",
    targetHandle: "input",
    type: "smoothstep",
    style: DEFAULT_EDGE_STYLE,
  },
  {
    id: "e2-3",
    source: "filter-1",
    sourceHandle: "if",
    target: "action-1",
    targetHandle: "input",
    type: "smoothstep",
    style: DEFAULT_EDGE_STYLE,
  },
  {
    id: "e3-4",
    source: "action-1",
    sourceHandle: "success",
    target: "notify-1",
    targetHandle: "input",
    type: "smoothstep",
    style: DEFAULT_EDGE_STYLE,
  },
];

export function WorkflowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, type: "smoothstep", style: DEFAULT_EDGE_STYLE }, eds)
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) ?? { x: 0, y: 0 };
      setNodes((nds) =>
        nds.concat({
          id: `${type}-${Date.now()}`,
          type,
          position,
          data:
            type === "filter"
              ? { label: "Condition", conditions: [], logic: "and" }
              : { label: type },
        })
      );
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-full w-full flex" style={{ background: "var(--canvas-bg)" }}>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--node-border)" />
          <Controls showInteractive={false} />
          <MiniMap nodeColor="var(--surface-4)" maskColor="rgba(250,250,250,0.6)" />
        </ReactFlow>
      </div>

      <RightPanel selectedNode={selectedNode} />
    </div>
  );
}

export function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
