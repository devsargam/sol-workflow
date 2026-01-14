// API client for graph-based workflows
import { ENV_DEFAULTS, WORKFLOW_METADATA, API } from "utils";
import { getAccessToken } from "@privy-io/react-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || ENV_DEFAULTS.NEXT_PUBLIC_API_URL;

async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const token = await getAccessToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch (error) {
    return {
      "Content-Type": "application/json",
    };
  }
}

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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}`, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    throw new Error("Failed to fetch workflows");
  }
  return res.json();
}

export async function fetchWorkflow(id: string): Promise<{ workflow: Workflow }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}`, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    if (res.status === 403) throw new Error("Forbidden - You don't have access to this workflow");
    throw new Error("Failed to fetch workflow");
  }
  return res.json();
}

export async function createWorkflow(data: CreateWorkflowData): Promise<{ workflow: Workflow }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}`, {
    method: "POST",
    headers,
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
    if (res.status === 401) throw new Error("Unauthorized - Please login");
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
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}`, {
    method: "PATCH",
    headers,
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
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    if (res.status === 403) throw new Error("Forbidden - You don't have access to this workflow");
    const error = await res.json();
    throw new Error(error.error || "Failed to update workflow");
  }
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<{ workflow: Workflow }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    if (res.status === 403) throw new Error("Forbidden - You don't have access to this workflow");
    throw new Error("Failed to delete workflow");
  }
  return res.json();
}

export async function toggleWorkflow(id: string): Promise<{ workflow: Workflow }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.WORKFLOWS}/${id}/toggle`, {
    method: "POST",
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    if (res.status === 403) throw new Error("Forbidden - You don't have access to this workflow");
    throw new Error("Failed to toggle workflow");
  }
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
  metadata?: {
    kalshiOrder?: {
      orderId: string;
      marketId: string;
      side: "yes" | "no";
      action?: "buy" | "sell";
      count: number;
      price: number;
      status: string;
      cost: number;
      demo: boolean;
      placedAt: string;
    };
    kalshiError?: string;
  };
}

export async function fetchExecutions(workflowId?: string): Promise<{ executions: Execution[] }> {
  const headers = await getAuthHeaders();
  const url = workflowId
    ? `${API_URL}${API.ROUTES.EXECUTIONS}?workflow_id=${workflowId}`
    : `${API_URL}${API.ROUTES.EXECUTIONS}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    throw new Error("Failed to fetch executions");
  }
  return res.json();
}

export async function fetchExecution(id: string): Promise<{ execution: Execution }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${API.ROUTES.EXECUTIONS}/${id}`, { headers });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Unauthorized - Please login");
    if (res.status === 404) throw new Error("Execution not found");
    throw new Error("Failed to fetch execution");
  }
  return res.json();
}
