"use client";

import { useState, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Controls,
  MiniMap,
  Background,
  Panel,
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
import { Sidebar } from "./Sidebar";
import { NodeConfigPanel } from "./NodeConfigPanel";

// Define custom node types
const nodeTypes = {
  trigger: TriggerNode,
  filter: FilterNode,
  action: ActionNode,
  notify: NotifyNode,
};

// Initial nodes for a new workflow
const initialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 100, y: 200 },
    data: {
      label: "Trigger",
      type: "balance_change",
      config: {},
    },
  },
  {
    id: "filter-1",
    type: "filter",
    position: { x: 350, y: 200 },
    data: {
      label: "Filter",
      conditions: [],
    },
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 600, y: 200 },
    data: {
      label: "Action",
      type: "send_sol",
      config: {},
    },
  },
  {
    id: "notify-1",
    type: "notify",
    position: { x: 850, y: 200 },
    data: {
      label: "Notify",
      type: "discord",
      webhookUrl: "",
      template: "default",
    },
  },
];

// Initial edges connecting the nodes
const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "trigger-1",
    target: "filter-1",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "filter-1",
    target: "action-1",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
  },
  {
    id: "e3-4",
    source: "action-1",
    target: "notify-1",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
  },
];

export function WorkflowBuilderContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Update node data
  const updateNodeData = useCallback(
    (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      // Check if the dropped element is valid
      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      }) ?? { x: 0, y: 0 };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type}` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-full w-full flex">
      <Sidebar />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Cross} gap={12} size={1} />
          <Controls />
          <MiniMap />

          <Panel
            position="top-left"
            className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 m-4"
          >
            <h2 className="text-xl font-semibold mb-2">Workflow Builder</h2>
            <p className="text-sm text-neutral-600">
              Drag nodes from the sidebar to build your workflow
            </p>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => setSelectedNode(null)}
        />
      )}
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
