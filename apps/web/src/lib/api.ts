// API client for graph-based workflows
import { ENV_DEFAULTS, WORKFLOW_METADATA, API } from "utils";
import { getStoredWalletSession } from "./auth-storage";

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

function resolveApiUrl() {
  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return normalizeUrl(configuredApiUrl);
  }

  if (typeof window === "undefined") {
    return normalizeUrl(ENV_DEFAULTS.NEXT_PUBLIC_API_URL);
  }

  const { protocol, hostname } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3001";
  }

  const baseHostname = hostname.replace(/^(www|app)\./, "");
  return `${protocol}//api.${baseHostname}`;
}

const API_URL = resolveApiUrl();
const AUTH_ROUTE_CANDIDATES = Array.from(new Set([API.ROUTES.AUTH, `/api${API.ROUTES.AUTH}`]));

async function fetchAuthRoute(path: string, init: RequestInit) {
  let lastResponse: Response | null = null;

  for (const route of AUTH_ROUTE_CANDIDATES) {
    const response = await fetch(`${API_URL}${route}${path}`, init);

    if (response.status !== 404) {
      return response;
    }

    lastResponse = response;
  }

  return lastResponse ?? fetch(`${API_URL}${API.ROUTES.AUTH}${path}`, init);
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = getStoredWalletSession()?.token;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function requestWalletChallenge(
  walletAddress: string
): Promise<{ nonce: string; message: string; expiresIn: number }> {
  const res = await fetchAuthRoute("/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ walletAddress }),
  });

  if (!res.ok) {
    throw new Error("Failed to create wallet challenge");
  }

  return res.json();
}

export async function verifyWalletChallenge(data: {
  walletAddress: string;
  nonce: string;
  message: string;
  signature: string;
}): Promise<{ token: string; walletAddress: string }> {
  const res = await fetchAuthRoute("/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMessage =
      typeof (json as any)?.error === "string" ? (json as any).error : "Wallet verification failed";
    throw new Error(errorMessage);
  }

  return json as { token: string; walletAddress: string };
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

export function buildBalanceMonitorGraph(walletAddress: string): WorkflowGraph {
  return {
    nodes: [
      {
        id: "trigger-1",
        type: "trigger",
        position: { x: 250, y: 100 },
        data: {
          nodeType: "trigger",
          triggerType: "balance_change",
          config: { address: walletAddress, changeType: "increase" },
        },
      },
      {
        id: "action-1",
        type: "action",
        position: { x: 250, y: 300 },
        data: {
          nodeType: "action",
          actionType: "do_nothing",
          config: {},
        },
      },
    ],
    edges: [{ id: "edge-1", source: "trigger-1", target: "action-1" }],
  };
}

export async function createBalanceMonitorWorkflow(
  walletAddress: string
): Promise<{ workflow: Workflow }> {
  return createWorkflow({
    name: "SOL Balance Monitor",
    description: "Watches for incoming SOL to your wallet",
    graph: buildBalanceMonitorGraph(walletAddress),
    metadata: { createdWith: "quick-setup" },
  });
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
    throw new Error("Failed to fetch execution");
  }
  return res.json();
}
