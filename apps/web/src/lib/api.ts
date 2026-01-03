// API client for graph-based workflows
import { ENV_DEFAULTS, WORKFLOW_METADATA, API } from "utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || ENV_DEFAULTS.NEXT_PUBLIC_API_URL;

export interface WorkflowGraph {
  nodes: any[];
  edges: any[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface WorkflowMetadata {
  version?: string;
  maxSolPerTx?: number;
  maxExecutionsPerHour?: number;
  createdWith?: string;
  lastModifiedWith?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  graph: WorkflowGraph;
  metadata: WorkflowMetadata;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  graph: WorkflowGraph;
  metadata?: WorkflowMetadata;
}

// Workflows API
export async function fetchWorkflows(): Promise<{ workflows: Workflow[] }> {
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}`);
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

export async function fetchWorkflow(id: string): Promise<{ workflow: Workflow }> {
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch workflow");
  return res.json();
}

export async function createWorkflow(data: CreateWorkflowData): Promise<{ workflow: Workflow }> {
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      metadata: {
        version: WORKFLOW_METADATA.VERSION,
        createdWith: WORKFLOW_METADATA.CREATED_WITH.VISUAL_BUILDER,
        ...data.metadata,
      },
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      typeof (json as any)?.error === "string"
        ? (json as any).error
        : typeof (json as any)?.message === "string"
          ? (json as any).message
          : json
            ? JSON.stringify(json)
            : `Failed to create workflow (${res.status})`;
    throw new Error(message);
  }
  return json as { workflow: Workflow };
}

export async function updateWorkflow(
  id: string,
  data: Partial<CreateWorkflowData>
): Promise<{ workflow: Workflow }> {
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      metadata: data.metadata
        ? {
            ...data.metadata,
            lastModifiedWith: WORKFLOW_METADATA.CREATED_WITH.VISUAL_BUILDER,
          }
        : undefined,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update workflow");
  }
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<{ workflow: Workflow }> {
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete workflow");
  return res.json();
}

export async function toggleWorkflow(id: string): Promise<{ workflow: Workflow }> {
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}/toggle`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to toggle workflow");
  return res.json();
}

// Executions API
export interface Execution {
  id: string;
  executionId: string;
  workflowId: string;
  status: string;
  triggerData: any;
  txSignature?: string;
  txError?: string;
  notificationSent?: string;
  notificationError?: string;
  startedAt: string;
  completedAt?: string;
}

export async function fetchExecutions(workflowId?: string): Promise<{ executions: Execution[] }> {
  const url = workflowId
    ? `${API_URL}${API.ROUTES.EXECUTIONS}?workflowId=${workflowId}`
    : `${API_URL}${API.ROUTES.EXECUTIONS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch executions");
  return res.json();
}

export async function fetchExecution(id: string): Promise<{ execution: Execution }> {
  const res = await fetch(`${API_URL}${API.ROUTES.EXECUTIONS}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch execution");
  return res.json();
}
