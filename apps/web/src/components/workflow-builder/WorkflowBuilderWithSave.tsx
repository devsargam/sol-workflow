"use client";

import {
  addEdge,
  applyEdgeChanges,
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
  type EdgeChange,
  type Node,
  type OnConnect,
  type OnEdgesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from "react";
import { ActionNode } from "./nodes/ActionNode";
import { FilterNode } from "./nodes/FilterNode";
import { NotifyNode } from "./nodes/NotifyNode";
import { TriggerNode } from "./nodes/TriggerNode";
import { RightPanel } from "./RightPanel";

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
    position: { x: 80, y: 260 },
    data: { label: "Trigger", triggerType: "balance_change", config: {} },
  },
  {
    id: "filter-1",
    type: "filter",
    position: { x: 460, y: 260 },
    data: { label: "Condition", conditions: [], logic: "and" },
  },
  {
    id: "action-1",
    type: "action",
    position: { x: 840, y: 260 },
    data: { label: "Action", actionType: "send_sol", config: {} },
  },
  {
    id: "notify-1",
    type: "notify",
    position: { x: 1220, y: 260 },
    data: { label: "Notify", notifyType: "discord", webhookUrl: "", template: "default" },
  },
];

const DEFAULT_EDGE_STYLE = {
  stroke: "var(--edge-color)",
  strokeWidth: 1.5,
};

function getEdgeSignature(edge: Pick<Edge, "source" | "sourceHandle" | "target" | "targetHandle">) {
  return [
    edge.source,
    edge.sourceHandle ?? "",
    edge.target,
    edge.targetHandle ?? "",
  ].join("__");
}

function dedupeEdges(edges: Edge[]): Edge[] {
  const seenIds = new Set<string>();
  const seenConnections = new Set<string>();

  return edges.filter((edge) => {
    const connectionKey = getEdgeSignature(edge);

    if (seenIds.has(edge.id) || seenConnections.has(connectionKey)) {
      return false;
    }

    seenIds.add(edge.id);
    seenConnections.add(connectionKey);
    return true;
  });
}

const getInitialEdges = (): Edge[] => [
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

interface WorkflowBuilderRef {
  getWorkflowData: () => any;
  loadWorkflow: (workflow: any) => void;
}

interface WorkflowBuilderProps {
  workflowName?: string;
  onNameChange?: (name: string) => void;
  workflowDescription?: string;
  onDescriptionChange?: (desc: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  editId?: string | null;
  onBack?: () => void;
  errors?: string[];
  onDismissErrors?: () => void;
}

const WorkflowBuilderContentInner = forwardRef<WorkflowBuilderRef, WorkflowBuilderProps>(
  (
    {
      workflowName,
      onNameChange,
      workflowDescription,
      onDescriptionChange,
      onSave,
      isSaving,
      editId,
      onBack,
      errors,
      onDismissErrors,
    },
    ref
  ) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes());
  const [edges, setEdges] = useEdgesState(getInitialEdges());
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const renderedEdges = useMemo(() => dedupeEdges(edges), [edges]);

  // Always derive from latest nodes so the panel re-renders when data changes
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

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
          sourceHandle: e.sourceHandle ?? undefined,
          target: e.target,
          targetHandle: e.targetHandle ?? undefined,
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
        setEdges(dedupeEdges(workflow.edges));
      } else if (workflow._visual) {
        setNodes(workflow._visual.nodes || getInitialNodes());
        setEdges(dedupeEdges(workflow._visual.edges || getInitialEdges()));
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
                type: "smoothstep",
                style: DEFAULT_EDGE_STYLE,
              });
            }
          }
        }

        setNodes(newNodes);
        setEdges(dedupeEdges(newEdges));
      }
    },
  }));

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) => {
      setEdges((currentEdges) => dedupeEdges(applyEdgeChanges(changes, currentEdges)));
    },
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) =>
        dedupeEdges(
          addEdge({ ...connection, type: "smoothstep", style: DEFAULT_EDGE_STYLE }, currentEdges)
        )
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
          data: { label: type },
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
          edges={renderedEdges}
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

      <RightPanel
        selectedNode={selectedNode}
        workflowName={workflowName}
        onNameChange={onNameChange}
        workflowDescription={workflowDescription}
        onDescriptionChange={onDescriptionChange}
        onSave={onSave}
        isSaving={isSaving}
        editId={editId}
        onBack={onBack}
        errors={errors}
        onDismissErrors={onDismissErrors}
      />
    </div>
  );
});

WorkflowBuilderContentInner.displayName = "WorkflowBuilderContentInner";

export const WorkflowBuilderContent = forwardRef<WorkflowBuilderRef, WorkflowBuilderProps>((props, ref) => {
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
