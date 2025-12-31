"use client";

import { useState, useCallback, useImperativeHandle, forwardRef } from "react";
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
const getInitialNodes = (): Node[] => [
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
const getInitialEdges = (): Edge[] => [
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

interface WorkflowBuilderRef {
  getWorkflowData: () => any;
  loadWorkflow: (workflow: any) => void;
}

const WorkflowBuilderContentInner = forwardRef<WorkflowBuilderRef, {}>(
  (_, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
    const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getWorkflowData: () => {
        // Find nodes by type
        const triggerNode = nodes.find((n) => n.type === "trigger");
        const filterNode = nodes.find((n) => n.type === "filter");
        const actionNode = nodes.find((n) => n.type === "action");
        const notifyNode = nodes.find((n) => n.type === "notify");

        // Build workflow data structure
        const workflowData: any = {};

        // Extract trigger data
        if (triggerNode) {
          workflowData.trigger = {
            type: triggerNode.data.type || "balance_change",
            config: triggerNode.data.config || {},
          };
        }

        // Extract filter data
        if (filterNode) {
          workflowData.filter = {
            conditions: filterNode.data.conditions || [],
          };
        }

        // Extract action data
        if (actionNode) {
          workflowData.action = {
            type: actionNode.data.type || "send_sol",
            config: actionNode.data.config || {},
          };
        }

        // Extract notify data
        if (notifyNode) {
          workflowData.notify = {
            type: notifyNode.data.type || "discord",
            webhookUrl: notifyNode.data.webhookUrl || "",
            template: notifyNode.data.template || "default",
          };
        }

        // Store visual representation for later loading
        workflowData._visual = {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            position: n.position,
            data: n.data,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: e.animated,
            style: e.style,
          })),
        };

        return workflowData;
      },
      loadWorkflow: (workflow: any) => {
        if (workflow._visual) {
          // Load from saved visual representation
          setNodes(workflow._visual.nodes || getInitialNodes());
          setEdges(workflow._visual.edges || getInitialEdges());
        } else {
          // Convert from API format to visual nodes
          const newNodes: Node[] = [];
          const newEdges: Edge[] = [];

          // Create trigger node
          if (workflow.trigger || workflow.triggerType) {
            newNodes.push({
              id: "trigger-1",
              type: "trigger",
              position: { x: 100, y: 200 },
              data: {
                label: "Trigger",
                type: workflow.trigger?.type || workflow.triggerType,
                config: workflow.trigger?.config || workflow.triggerConfig || {},
              },
            });
          }

          // Create filter node
          newNodes.push({
            id: "filter-1",
            type: "filter",
            position: { x: 350, y: 200 },
            data: {
              label: "Filter",
              conditions: workflow.filter?.conditions || workflow.filterConditions || [],
            },
          });

          // Create action node
          if (workflow.action || workflow.actionType) {
            newNodes.push({
              id: "action-1",
              type: "action",
              position: { x: 600, y: 200 },
              data: {
                label: "Action",
                type: workflow.action?.type || workflow.actionType,
                config: workflow.action?.config || workflow.actionConfig || {},
              },
            });
          }

          // Create notify node
          if (workflow.notify || workflow.notifyType) {
            newNodes.push({
              id: "notify-1",
              type: "notify",
              position: { x: 850, y: 200 },
              data: {
                label: "Notify",
                type: workflow.notify?.type || workflow.notifyType || "discord",
                webhookUrl: workflow.notify?.webhookUrl || workflow.notifyWebhookUrl || "",
                template: workflow.notify?.template || workflow.notifyTemplate || "default",
              },
            });
          }

          // Create edges between nodes
          if (newNodes.length > 1) {
            for (let i = 0; i < newNodes.length - 1; i++) {
              newEdges.push({
                id: `e${i}-${i + 1}`,
                source: newNodes[i].id,
                target: newNodes[i + 1].id,
                animated: true,
                style: { stroke: "#3b82f6", strokeWidth: 2 },
              });
            }
          }

          setNodes(newNodes);
          setEdges(newEdges);
        }
      },
    }));

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
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
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

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

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
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            <MiniMap />

            <Panel position="top-left" className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 m-4">
              <h2 className="text-xl font-semibold mb-2">Workflow Builder</h2>
              <p className="text-sm text-neutral-600">
                Configure nodes by clicking on them
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
);

WorkflowBuilderContentInner.displayName = "WorkflowBuilderContentInner";

export const WorkflowBuilderContent = forwardRef<WorkflowBuilderRef, {}>(
  (props, ref) => {
    return (
      <ReactFlowProvider>
        <WorkflowBuilderContentInner ref={ref} {...props} />
      </ReactFlowProvider>
    );
  }
);

WorkflowBuilderContent.displayName = "WorkflowBuilderContent";

export function WorkflowBuilderWithSave() {
  return <WorkflowBuilderContent />;
}