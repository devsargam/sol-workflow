"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { ActionNode } from "./nodes/ActionNode";
import { FilterNode } from "./nodes/FilterNode";
import { NotifyNode } from "./nodes/NotifyNode";
import { TriggerNode } from "./nodes/TriggerNode";
import { Sidebar } from "./Sidebar";

const nodeTypes = {
  trigger: TriggerNode,
  filter: FilterNode,
  action: ActionNode,
  notify: NotifyNode,
};

const getInitialNodes = (): Node[] => [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 100, y: 200 },
    data: {
      label: "Trigger",
      triggerType: "balance_change",
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
      logic: "and",
    },
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 600, y: 200 },
    data: {
      label: "Action",
      actionType: "send_sol",
      config: {},
    },
  },
  {
    id: "notify-1",
    type: "notify",
    position: { x: 850, y: 200 },
    data: {
      label: "Notify",
      notifyType: "discord",
      webhookUrl: "",
      template: "default",
    },
  },
];

const getInitialEdges = (): Edge[] => [
  {
    id: "e1-2",
    source: "trigger-1",
    target: "filter-1",
    animated: true,
    style: { stroke: "#000000", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "filter-1",
    target: "action-1",
    animated: true,
    style: { stroke: "#000000", strokeWidth: 2 },
  },
  {
    id: "e3-4",
    source: "action-1",
    target: "notify-1",
    animated: true,
    style: { stroke: "#000000", strokeWidth: 2 },
  },
];

interface WorkflowBuilderRef {
  getWorkflowData: () => any;
  loadWorkflow: (workflow: any) => void;
}

const WorkflowBuilderContentInner = forwardRef<WorkflowBuilderRef, {}>((_, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useImperativeHandle(ref, () => ({
    getWorkflowData: () => {
      return {
        nodes: nodes.map((n) => {
          const baseNode = {
            id: n.id,
            type: n.type,
            position: n.position,
            data: {
              nodeType: n.type,
            } as any,
          };

          switch (n.type) {
            case "trigger":
              baseNode.data.nodeType = "trigger";
              baseNode.data.triggerType = n.data.triggerType || n.data.type || "balance_change";
              baseNode.data.config = n.data.config || {};
              break;
            case "filter":
              baseNode.data.nodeType = "filter";
              baseNode.data.conditions = n.data.conditions || [];
              baseNode.data.logic = n.data.logic || "and";
              break;
            case "action":
              baseNode.data.nodeType = "action";
              baseNode.data.actionType = n.data.actionType || n.data.type || "send_sol";
              baseNode.data.config = n.data.config || {};
              break;
            case "notify":
              baseNode.data.nodeType = "notify";

              if (
                n.data.notifications &&
                Array.isArray(n.data.notifications) &&
                n.data.notifications.length > 0
              ) {
                delete baseNode.data.notifyType;
                delete baseNode.data.webhookUrl;
                delete baseNode.data.webhookSecret;
                delete baseNode.data.telegramBotToken;
                delete baseNode.data.telegramChatId;
                delete baseNode.data.telegramParseMode;
                delete baseNode.data.telegramDisableWebPreview;
                delete baseNode.data.template;
                delete baseNode.data.customMessage;

                baseNode.data.notifications = n.data.notifications
                  .map((notif: any) => {
                    const mapped: any = {
                      notifyType: notif.notifyType,
                      template: notif.template || "default",
                    };
                    if (notif.webhookUrl) mapped.webhookUrl = notif.webhookUrl;
                    if (notif.webhookSecret) mapped.webhookSecret = notif.webhookSecret;
                    if (notif.telegramBotToken) mapped.telegramBotToken = notif.telegramBotToken;
                    if (notif.telegramChatId) mapped.telegramChatId = notif.telegramChatId;
                    if (notif.telegramParseMode) mapped.telegramParseMode = notif.telegramParseMode;
                    if (notif.telegramDisableWebPreview !== undefined) {
                      mapped.telegramDisableWebPreview = notif.telegramDisableWebPreview;
                    }
                    if (notif.customMessage) mapped.customMessage = notif.customMessage;
                    return mapped;
                  })
                  .filter((notif: any) => notif.notifyType);
              } else {
                baseNode.data.notifyType = n.data.notifyType || n.data.type || "discord";
                baseNode.data.template = n.data.template || "default";

                if (
                  baseNode.data.notifyType === "discord" ||
                  baseNode.data.notifyType === "webhook"
                ) {
                  if (n.data.webhookUrl) baseNode.data.webhookUrl = n.data.webhookUrl;
                  if (n.data.webhookSecret) baseNode.data.webhookSecret = n.data.webhookSecret;
                }

                if (baseNode.data.notifyType === "telegram") {
                  if (n.data.telegramBotToken)
                    baseNode.data.telegramBotToken = n.data.telegramBotToken;
                  if (n.data.telegramChatId) baseNode.data.telegramChatId = n.data.telegramChatId;
                  if (n.data.telegramParseMode)
                    baseNode.data.telegramParseMode = n.data.telegramParseMode;
                  if (n.data.telegramDisableWebPreview !== undefined) {
                    baseNode.data.telegramDisableWebPreview = n.data.telegramDisableWebPreview;
                  }
                  if (n.data.customMessage) baseNode.data.customMessage = n.data.customMessage;
                }
              }
              break;
          }

          return baseNode;
        }),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          animated: e.animated,
          style: e.style,
          type: e.type,
        })),
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
        },
      };
    },
    loadWorkflow: (workflow: any) => {
      if (workflow.nodes && workflow.edges) {
        const normalizedNodes = workflow.nodes.map((node: Node) => {
          const nodeData = node.data || {};
          const nestedData = (nodeData as any)?.data || {};

          const normalizedData: any = {
            label: nodeData.label || node.type || "",
            ...nodeData,
          };

          if (node.type === "trigger") {
            normalizedData.triggerType =
              normalizedData.triggerType ||
              normalizedData.type ||
              nestedData.triggerType ||
              "balance_change";
            normalizedData.type = normalizedData.triggerType;
            normalizedData.config = normalizedData.config || nestedData.config || {};
            if (!normalizedData.config || typeof normalizedData.config !== "object") {
              normalizedData.config = {};
            }
          }

          if (node.type === "action") {
            normalizedData.actionType =
              normalizedData.actionType ||
              normalizedData.type ||
              nestedData.actionType ||
              "send_sol";
            normalizedData.type = normalizedData.actionType;
            normalizedData.config = normalizedData.config || nestedData.config || {};
            if (!normalizedData.config || typeof normalizedData.config !== "object") {
              normalizedData.config = {};
            }
          }

          if (node.type === "filter") {
            normalizedData.conditions = normalizedData.conditions || nestedData.conditions || [];
            normalizedData.logic = normalizedData.logic || nestedData.logic || "and";
          }

          if (node.type === "notify") {
            normalizedData.notifyType =
              normalizedData.notifyType ||
              normalizedData.type ||
              nestedData.notifyType ||
              "discord";
            normalizedData.type = normalizedData.notifyType;
            normalizedData.webhookUrl = normalizedData.webhookUrl || nestedData.webhookUrl || "";
            normalizedData.webhookSecret =
              normalizedData.webhookSecret || nestedData.webhookSecret || "";
            normalizedData.template = normalizedData.template || nestedData.template || "default";
            if (normalizedData.notifications && Array.isArray(normalizedData.notifications)) {
            }
          }

          return {
            ...node,
            data: normalizedData,
          };
        });

        setNodes(normalizedNodes);
        setEdges(workflow.edges);
      } else if (workflow._visual) {
        setNodes(workflow._visual.nodes || getInitialNodes());
        setEdges(workflow._visual.edges || getInitialEdges());
      } else {
        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

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

        newNodes.push({
          id: "filter-1",
          type: "filter",
          position: { x: 350, y: 200 },
          data: {
            label: "Filter",
            conditions: workflow.filter?.conditions || workflow.filterConditions || [],
          },
        });

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

        if (workflow.notify || workflow.notifyType) {
          newNodes.push({
            id: "notify-1",
            type: "notify",
            position: { x: 850, y: 200 },
            data: {
              label: "Notify",
              type: workflow.notify?.type || workflow.notifyType || "discord",
              webhookUrl: workflow.notify?.webhookUrl || workflow.notifyWebhookUrl || "",
              webhookSecret: workflow.notify?.webhookSecret || "",
              template: workflow.notify?.template || workflow.notifyTemplate || "default",
            },
          });
        }

        if (newNodes.length > 1) {
          for (let i = 0; i < newNodes.length - 1; i++) {
            const sourceNode = newNodes[i];
            const targetNode = newNodes[i + 1];
            if (sourceNode && targetNode) {
              newEdges.push({
                id: `e${i}-${i + 1}`,
                source: sourceNode.id,
                target: targetNode.id,
                animated: true,
                style: { stroke: "#000000", strokeWidth: 2 },
              });
            }
          }
        }

        setNodes(newNodes);
        setEdges(newEdges);
      }
    },
  }));

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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

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
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Controls />
          <MiniMap />
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
});

WorkflowBuilderContentInner.displayName = "WorkflowBuilderContentInner";

export const WorkflowBuilderContent = forwardRef<WorkflowBuilderRef, {}>((props, ref) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContentInner ref={ref} {...props} />
    </ReactFlowProvider>
  );
});

WorkflowBuilderContent.displayName = "WorkflowBuilderContent";

export function WorkflowBuilderWithSave() {
  return <WorkflowBuilderContent />;
}
