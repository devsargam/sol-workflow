"use client";

import { cn } from "@/lib/utils";
import { getPublicApiBaseUrl } from "@/lib/api";
import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import { API } from "utils";
import {
  ArrowLeftIcon,
  BroadcastIcon as WebhookIcon,
  ChatCircleTextIcon as MessageCircleIcon,
  EnvelopeSimpleIcon as MailIcon,
  FadersHorizontalIcon as SlidersHorizontalIcon,
  LightningIcon as ZapIcon,
  MegaphoneIcon,
  MoneyIcon as BanknoteIcon,
  PlusIcon,
  XIcon,
  BellIcon,
  PaperPlaneTiltIcon as SendIcon,
  WebhooksLogoIcon,
} from "@phosphor-icons/react";
import { useCallback, useMemo, useEffect } from "react";
import type {
  ActionNodeData,
  FilterNodeData,
  NotifyNodeData,
  TriggerNodeData,
} from "./types";
import { NodeField, NodeInput, NodeSelect } from "./nodes/node-inputs";

// ─── Sidebar node palette items ───────────────────────────────

const PALETTE = [
  {
    type: "trigger",
    label: "Trigger",
    description: "React to on-chain events",
    Icon: ZapIcon,
    accent: "#9945FF",
  },
  {
    type: "filter",
    label: "Condition",
    description: "Branch with if / else",
    Icon: SlidersHorizontalIcon,
    accent: "#F97316",
  },
  {
    type: "action",
    label: "Action",
    description: "Execute on-chain",
    Icon: BanknoteIcon,
    accent: "#06B6D4",
  },
  {
    type: "notify",
    label: "Notify",
    description: "Send notifications",
    Icon: MegaphoneIcon,
    accent: "#10B981",
  },
];

// ─── RightPanel ───────────────────────────────────────────────

interface RightPanelProps {
  selectedNode: Node | null;
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

export function RightPanel({
  selectedNode,
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
}: RightPanelProps) {
  const hasWorkflowMeta = !!(onNameChange || onSave || onBack);

  return (
    <aside
      className="w-[300px] flex-shrink-0 flex flex-col border-l bg-[var(--surface-2)]"
      style={{ borderColor: "var(--node-border)" }}
    >
      {/* ── Top bar: back + name + save ── */}
      {hasWorkflowMeta && (
        <>
          <div
            className="flex items-center gap-1.5 px-2 py-2 border-b"
            style={{ borderColor: "var(--node-border)" }}
          >
            {onBack && (
              <button
                onClick={onBack}
                className="h-[28px] w-[28px] flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-4)] transition-colors flex-shrink-0"
                title="Back to workflows"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
            )}

            <input
              value={workflowName ?? ""}
              onChange={(e) => onNameChange?.(e.target.value)}
              placeholder="Workflow name..."
              className="flex-1 min-w-0 text-sm font-medium bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />

            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="h-[28px] px-3 text-xs font-medium rounded-md bg-[var(--brand)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex-shrink-0"
              >
                {isSaving ? "Saving…" : editId ? "Save" : "Create"}
              </button>
            )}
          </div>

          <div
            className="px-3 py-1.5 border-b"
            style={{ borderColor: "var(--node-border)" }}
          >
            <input
              value={workflowDescription ?? ""}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              placeholder="Add a description…"
              className="w-full text-xs bg-transparent border-none outline-none text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
            />
          </div>
        </>
      )}

      {/* ── Errors ── */}
      {errors && errors.length > 0 && (
        <div className="mx-2 mt-2 p-2.5 rounded-md bg-red-50 border border-red-200">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-700">{err}</p>
              ))}
            </div>
            {onDismissErrors && (
              <button
                onClick={onDismissErrors}
                className="text-red-400 hover:text-red-600 flex-shrink-0 mt-0.5"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ToolbarTab />
        </div>

        <div
          className="min-h-0 basis-1/2 overflow-y-auto border-t"
          style={{ borderColor: "var(--node-border)" }}
        >
          <EditorTab selectedNode={selectedNode} workflowId={editId} />
        </div>
      </div>
    </aside>
  );
}

// ─── Editor tab ───────────────────────────────────────────────

function EditorTab({
  selectedNode,
  workflowId,
}: {
  selectedNode: Node | null;
  workflowId?: string | null;
}) {
  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[var(--text-muted)]">
          Select a block to edit
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-1">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
        Editor
      </p>

      {selectedNode.type === "trigger" && (
        <TriggerEditor
          id={selectedNode.id}
          data={selectedNode.data as TriggerNodeData}
          workflowId={workflowId}
        />
      )}
      {selectedNode.type === "filter" && (
        <FilterEditor id={selectedNode.id} data={selectedNode.data as FilterNodeData} />
      )}
      {selectedNode.type === "action" && (
        <ActionEditor id={selectedNode.id} data={selectedNode.data as ActionNodeData} />
      )}
      {selectedNode.type === "notify" && (
        <NotifyEditor id={selectedNode.id} data={selectedNode.data as NotifyNodeData} />
      )}
    </div>
  );
}

function buildWebhookUrl(webhookId: string | undefined) {
  if (!webhookId) return "";
  return `${getPublicApiBaseUrl()}${API.ROUTES.WEBHOOKS}/${webhookId}`;
}

// ─── Trigger editor ───────────────────────────────────────────

function TriggerEditor({
  id,
  data,
  workflowId,
}: {
  id: string;
  data: TriggerNodeData;
  workflowId?: string | null;
}) {
  const { updateNodeData } = useReactFlow();
  const triggerType = data.triggerType || data.type || "balance_change";
  const isBalanceChange = triggerType === "balance_change";
  const isCron = triggerType === "cron";
  const isWebhook = triggerType === "webhook";
  const isNewTokenListing = triggerType === "new_token_listing";
  const webhookUrl = buildWebhookUrl(data.config?.webhookId);
  const webhookInputFormat = data.config?.inputFormat || [];

  const setType = useCallback(
    (type: string) =>
      updateNodeData(id, (n) => {
        const current = n.data as TriggerNodeData;
        const nextConfig = { ...(current.config || {}) };

        if (type === "webhook") {
          nextConfig.webhookId ||= crypto.randomUUID();
          nextConfig.authEnabled ??= false;
          nextConfig.authHeaderName ||= "Authorization";
        }

        if (type === "new_token_listing") {
          nextConfig.source ||= "birdeye";
          nextConfig.includeMemePlatforms ??= true;
          nextConfig.limit ||= 10;
          nextConfig.pollIntervalSeconds ||= 60;
        }

        return { ...n.data, type, triggerType: type, config: nextConfig };
      }),
    [id, updateNodeData]
  );
  const setConfig = useCallback(
    (patch: TriggerNodeData["config"]) =>
      updateNodeData(id, (n) => ({
        config: { ...(n.data as TriggerNodeData).config, ...patch },
      })),
    [id, updateNodeData]
  );

  useEffect(() => {
    if (!isWebhook) return;

    if (!data.config?.webhookId) {
      setConfig({ webhookId: crypto.randomUUID(), authEnabled: data.config?.authEnabled ?? false });
      return;
    }

    if (data.config?.authEnabled && !data.config?.authHeaderName) {
      setConfig({ authHeaderName: "Authorization" });
    }
  }, [
    data.config?.authEnabled,
    data.config?.authHeaderName,
    data.config?.webhookId,
    isWebhook,
    setConfig,
  ]);

  return (
    <div className="space-y-3">
      <NodeField label="Event Type">
        <NodeSelect
          value={triggerType}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="balance_change">Balance Change</option>
          <option value="token_receipt">Token Receipt</option>
          <option value="nft_receipt">NFT Receipt</option>
          <option value="transaction_status">Transaction Status</option>
          <option value="program_log">Program Log</option>
          <option value="new_token_listing">New Token Listing</option>
          <option value="cron">Scheduled (Cron)</option>
          <option value="webhook">Webhook</option>
        </NodeSelect>
      </NodeField>

      {!isCron && !isWebhook && !isNewTokenListing && (
        <NodeField label="Address">
          <NodeInput
            mono
            placeholder="Solana address..."
            value={data.config?.address || ""}
            onChange={(e) => setConfig({ address: e.target.value })}
          />
        </NodeField>
      )}

      {isBalanceChange && (
        <>
          <NodeField label="Min Change (lamports)">
            <NodeInput
              mono
              type="number"
              placeholder="900000000"
              value={data.config?.minChange ?? ""}
              onChange={(e) =>
                setConfig({
                  minChange: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </NodeField>
          <NodeField label="Change Type">
            <NodeSelect
              value={data.config?.changeType || "any"}
              onChange={(e) => setConfig({ changeType: e.target.value })}
            >
              <option value="any">Any</option>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </NodeSelect>
          </NodeField>
        </>
      )}

      {isNewTokenListing && (
        <>
          <NodeField label="Source">
            <NodeSelect value={data.config?.source || "birdeye"} disabled>
              <option value="birdeye">Birdeye</option>
            </NodeSelect>
          </NodeField>

          <div className="flex items-center justify-between rounded-md border border-[var(--node-border)] bg-[var(--surface-3)] px-2.5 py-2">
            <div>
              <p className="text-[12px] text-[var(--text-primary)]">Include meme platforms</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Includes Birdeye listings from pump.fun-style launch sources
              </p>
            </div>
            <input
              type="checkbox"
              checked={data.config?.includeMemePlatforms ?? true}
              onChange={(e) => setConfig({ includeMemePlatforms: e.target.checked })}
              className="h-4 w-4"
            />
          </div>

          <NodeField label="Min Liquidity (USD)">
            <NodeInput
              type="number"
              placeholder="10000"
              value={data.config?.minLiquidityUsd ?? ""}
              onChange={(e) =>
                setConfig({
                  minLiquidityUsd: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </NodeField>

          <NodeField label="Min 24h Volume (USD)">
            <NodeInput
              type="number"
              placeholder="0"
              value={data.config?.minVolume24hUsd ?? ""}
              onChange={(e) =>
                setConfig({
                  minVolume24hUsd: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </NodeField>

          <div className="grid grid-cols-2 gap-2">
            <NodeField label="Fetch Limit">
              <NodeInput
                type="number"
                min={1}
                max={20}
                placeholder="10"
                value={data.config?.limit ?? 10}
                onChange={(e) =>
                  setConfig({
                    limit: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </NodeField>
            <NodeField label="Poll Seconds">
              <NodeInput
                type="number"
                min={30}
                placeholder="60"
                value={data.config?.pollIntervalSeconds ?? 60}
                onChange={(e) =>
                  setConfig({
                    pollIntervalSeconds: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </NodeField>
          </div>
        </>
      )}

      {triggerType === "program_log" && (
        <NodeField label="Log Pattern">
          <NodeInput
            placeholder="pattern to match..."
            value={data.config?.logPattern || ""}
            onChange={(e) => setConfig({ logPattern: e.target.value })}
          />
        </NodeField>
      )}

      {isCron && (
        <>
          <NodeField label="Schedule (cron)">
            <NodeInput
              mono
              placeholder="0 * * * *"
              value={data.config?.schedule || ""}
              onChange={(e) => setConfig({ schedule: e.target.value })}
            />
          </NodeField>
          <NodeField label="Timezone">
            <NodeInput
              placeholder="UTC"
              value={data.config?.timezone || ""}
              onChange={(e) => setConfig({ timezone: e.target.value })}
            />
          </NodeField>
        </>
      )}

      {isWebhook && (
        <>
          <NodeField label="Webhook URL">
            <NodeInput mono readOnly value={webhookUrl} />
          </NodeField>

          <div className="flex items-center gap-2 rounded-md border border-[var(--node-border)] bg-[var(--surface-3)] px-2.5 py-2">
            <WebhooksLogoIcon className="h-4 w-4 text-[var(--text-muted)]" />
            <p className="text-[11px] text-[var(--text-secondary)]">
              Request data becomes available later as `trigger.input`, `trigger.body`, `trigger.query`, and `trigger.headers`.
            </p>
          </div>

          <NodeField label="Input Format">
            <WebhookInputFormatEditor
              fields={webhookInputFormat}
              onChange={(next) => setConfig({ inputFormat: next })}
            />
          </NodeField>

          <div className="flex items-center justify-between rounded-md border border-[var(--node-border)] bg-[var(--surface-3)] px-2.5 py-2">
            <div>
              <p className="text-[12px] text-[var(--text-primary)]">Require auth header</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Validates a header before the workflow runs
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(data.config?.authEnabled)}
              onChange={(e) => setConfig({ authEnabled: e.target.checked })}
              className="h-4 w-4"
            />
          </div>

          {data.config?.authEnabled && (
            <>
              <NodeField label="Auth Header Name">
                <NodeInput
                  mono
                  placeholder="Authorization"
                  value={data.config?.authHeaderName || "Authorization"}
                  onChange={(e) => setConfig({ authHeaderName: e.target.value })}
                />
              </NodeField>
              <NodeField label="Auth Header Value">
                <NodeInput
                  mono
                  type="password"
                  placeholder="Bearer your-secret"
                  value={data.config?.authHeaderValue || ""}
                  onChange={(e) => setConfig({ authHeaderValue: e.target.value })}
                />
              </NodeField>
            </>
          )}

          <button
            type="button"
            onClick={() => setConfig({ webhookId: crypto.randomUUID() })}
            className="w-full rounded-md border border-[var(--node-border)] bg-[var(--surface-3)] px-2.5 py-2 text-[12px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-4)]"
          >
            Rotate webhook URL
          </button>

          {!workflowId && (
            <p className="text-[10px] text-[var(--text-muted)]">
              Save the workflow once to get the final live backend URL.
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ─── Filter / Condition editor ────────────────────────────────

const OPERATORS = ["==", "!=", ">", ">=", "<", "<=", "contains", "starts_with", "ends_with"];
type Condition = { field: string; operator: string; value: string };
type ReferenceSuggestion = { value: string; label: string; hint: string };
type WebhookInputField = NonNullable<NonNullable<TriggerNodeData["config"]>["inputFormat"]>[number];

const TRIGGER_REFERENCE_FIELDS: Record<string, string[]> = {
  balance_change: [
    "address",
    "lamports",
    "previousLamports",
    "changeLamports",
    "changeSol",
    "changeDirection",
    "slot",
  ],
  token_receipt: ["address", "slot", "accountData", "type"],
  nft_receipt: ["address", "slot", "accountData", "type"],
  transaction_status: ["signature", "status", "slot", "err"],
  program_log: ["programId", "signature", "logs", "slot", "err"],
  new_token_listing: [
    "type",
    "source",
    "firedAt",
    "address",
    "mint",
    "symbol",
    "name",
    "liquidityUsd",
    "volume24hUsd",
    "priceUsd",
    "marketCapUsd",
    "listedAt",
  ],
  cron: ["type", "firedAt", "schedule", "timezone"],
  webhook: [
    "type",
    "firedAt",
    "method",
    "requestId",
    "input",
    "body",
    "query",
    "headers",
    "rawBody",
  ],
};

const STEP_OUTPUT_FIELDS: Record<string, string[]> = {
  filter: ["passed", "output", "logic"],
  action: ["txSignature", "output", "actionType", "success"],
  notify: ["notificationCount", "success", "notifyType"],
  trigger: [],
};

function getUpstreamNodeIds(currentNodeId: string, edges: Edge[]) {
  const incomingByTarget = new Map<string, string[]>();

  for (const edge of edges) {
    const sources = incomingByTarget.get(edge.target) ?? [];
    sources.push(edge.source);
    incomingByTarget.set(edge.target, sources);
  }

  const visited = new Set<string>();
  const queue = [...(incomingByTarget.get(currentNodeId) ?? [])];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) continue;

    visited.add(nodeId);

    for (const sourceId of incomingByTarget.get(nodeId) ?? []) {
      if (!visited.has(sourceId)) {
        queue.push(sourceId);
      }
    }
  }

  return visited;
}

function buildReferenceSuggestions(currentNodeId: string, nodes: Node[], edges: Edge[]) {
  const upstreamNodeIds = getUpstreamNodeIds(currentNodeId, edges);
  const candidateNodes = nodes.filter((node) => {
    if (node.id === currentNodeId) return false;
    if (upstreamNodeIds.size === 0) return node.type === "trigger";
    return upstreamNodeIds.has(node.id);
  });

  const suggestions: ReferenceSuggestion[] = [];
  const seen = new Set<string>();

  for (const node of candidateNodes) {
    if (node.type === "trigger") {
      const triggerData = node.data as TriggerNodeData;
      const triggerType = triggerData.triggerType || triggerData.type || "balance_change";
      const fields = TRIGGER_REFERENCE_FIELDS[triggerType] ?? ["type"];

      for (const field of fields) {
        const value = `trigger.${field}`;
        if (seen.has(value)) continue;
        seen.add(value);
        suggestions.push({
          value,
          label: "Trigger",
          hint: field,
        });
      }

      if (triggerType === "webhook" && triggerData.config?.inputFormat?.length) {
        for (const inputField of triggerData.config.inputFormat) {
          const fieldName = inputField.name?.trim();
          if (!fieldName) continue;

          const value = `trigger.input.${fieldName}`;
          if (seen.has(value)) continue;
          seen.add(value);
          suggestions.push({
            value,
            label: "Trigger",
            hint: `${fieldName}${inputField.type ? ` (${inputField.type})` : ""}`,
          });
        }
      }

      continue;
    }

    const nodeType = node.type ?? "";
    const fields = STEP_OUTPUT_FIELDS[nodeType] ?? ["output"];
    for (const field of fields) {
      const value = `${node.id}.${field}`;
      if (seen.has(value)) continue;
      seen.add(value);
      suggestions.push({
        value,
        label: String(node.data?.label || node.id),
        hint: field,
      });
    }
  }

  return suggestions;
}

function FilterEditor({ id, data }: { id: string; data: FilterNodeData }) {
  const { updateNodeData, getEdges, getNodes } = useReactFlow();
  const conditions: Condition[] = data.conditions ?? [];
  const referenceSuggestions = useMemo(
    () => buildReferenceSuggestions(id, getNodes(), getEdges()),
    [getEdges, getNodes, id]
  );
  const fieldExamples = referenceSuggestions.slice(0, 6);

  const setConditions = useCallback(
    (next: Condition[]) => updateNodeData(id, { conditions: next }),
    [id, updateNodeData]
  );

  const add = () =>
    setConditions([...conditions, { field: "", operator: "==", value: "" }]);
  const remove = (i: number) =>
    setConditions(conditions.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<Condition>) =>
    setConditions(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">
        If all conditions match → <span className="font-medium text-[var(--text-secondary)]">if</span> path.
        Otherwise → <span className="font-medium text-[var(--text-secondary)]">else</span> path.
      </p>
      <p className="text-[11px] text-[var(--text-muted)]">
        Reference trigger data with <span className="font-mono text-[var(--text-secondary)]">trigger.lamports</span>
        {" "}or upstream step outputs like{" "}
        <span className="font-mono text-[var(--text-secondary)]">action-1.txSignature</span>.
      </p>

      {conditions.map((cond, i) => (
        <div key={i} className="space-y-2 p-2.5 rounded-md bg-[var(--surface-3)] border border-[var(--node-border)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Condition {i + 1}
            </span>
            <button
              onClick={() => remove(i)}
              className="h-4 w-4 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-4)] transition-colors"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          <NodeField label="Field">
            <div className="space-y-2">
              <NodeInput
                mono
                list={`field-suggestions-${id}`}
                placeholder="e.g. trigger.lamports"
                value={cond.field}
                onChange={(e) => update(i, { field: e.target.value })}
              />
              {fieldExamples.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fieldExamples.map((suggestion) => (
                    <button
                      key={`${id}-${i}-${suggestion.value}`}
                      type="button"
                      onClick={() => update(i, { field: suggestion.value })}
                      className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--node-border-strong)] transition-colors"
                      style={{
                        background: "var(--surface-2)",
                        borderColor: "var(--node-border)",
                      }}
                      title={`${suggestion.label}.${suggestion.hint}`}
                    >
                      {suggestion.value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </NodeField>
          <div className="grid grid-cols-2 gap-2">
            <NodeField label="Operator">
              <NodeSelect
                value={cond.operator}
                onChange={(e) => update(i, { operator: e.target.value })}
              >
                {OPERATORS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </NodeSelect>
            </NodeField>
            <NodeField label="Value">
              <NodeInput
                mono
                placeholder="value"
                value={cond.value}
                onChange={(e) => update(i, { value: e.target.value })}
              />
            </NodeField>
          </div>
        </div>
      ))}

      {referenceSuggestions.length > 0 && (
        <datalist id={`field-suggestions-${id}`}>
          {referenceSuggestions.map((suggestion) => (
            <option key={`${id}-${suggestion.value}`} value={suggestion.value}>
              {suggestion.label}.{suggestion.hint}
            </option>
          ))}
        </datalist>
      )}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-[var(--node-border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--node-border-strong)] transition-colors"
      >
        <PlusIcon className="h-3 w-3" />
        Add condition
      </button>
    </div>
  );
}

// ─── Action editor ────────────────────────────────────────────

function ActionEditor({ id, data }: { id: string; data: ActionNodeData }) {
  const { updateNodeData } = useReactFlow();

  const setType = useCallback(
    (type: string) => updateNodeData(id, { type, actionType: type }),
    [id, updateNodeData]
  );
  const setConfig = useCallback(
    (patch: ActionNodeData["config"]) =>
      updateNodeData(id, (n) => ({
        config: { ...(n.data as ActionNodeData).config, ...patch },
      })),
    [id, updateNodeData]
  );

  const type = data.actionType || data.type || "send_sol";
  const cfg = data.config ?? {};

  return (
    <div className="space-y-3">
      <NodeField label="Action Type">
        <NodeSelect value={type} onChange={(e) => setType(e.target.value)}>
          <option value="send_sol">Send SOL</option>
          <option value="send_spl_token">Send Token</option>
          <option value="call_program">Call Program</option>
          <option value="do_nothing">Do Nothing</option>
        </NodeSelect>
      </NodeField>

      {(type === "send_sol" || type === "send_spl_token") && (
        <>
          <NodeField label={type === "send_sol" ? "Amount (lamports)" : "Amount"}>
            <NodeInput
              type="number"
              placeholder="0"
              value={cfg.amount ?? ""}
              onChange={(e) =>
                setConfig({ amount: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </NodeField>
          <NodeField label="To Address">
            <NodeInput
              mono
              placeholder="Solana address..."
              value={cfg.toAddress || ""}
              onChange={(e) => setConfig({ toAddress: e.target.value })}
            />
          </NodeField>
        </>
      )}

      {type === "send_spl_token" && (
        <NodeField label="Token Mint">
          <NodeInput
            mono
            placeholder="Token mint address..."
            value={cfg.tokenMint || ""}
            onChange={(e) => setConfig({ tokenMint: e.target.value })}
          />
        </NodeField>
      )}

      {type === "call_program" && (
        <>
          <NodeField label="Program ID">
            <NodeInput
              mono
              placeholder="Program address..."
              value={cfg.programId || ""}
              onChange={(e) => setConfig({ programId: e.target.value })}
            />
          </NodeField>
          <NodeField label="Instruction">
            <NodeInput
              placeholder="Instruction name..."
              value={cfg.instruction || ""}
              onChange={(e) => setConfig({ instruction: e.target.value })}
            />
          </NodeField>
        </>
      )}
    </div>
  );
}

function WebhookInputFormatEditor({
  fields,
  onChange,
}: {
  fields: WebhookInputField[];
  onChange: (next: WebhookInputField[]) => void;
}) {
  const addField = () => {
    onChange([
      ...fields,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "string",
        description: "",
        value: "",
      },
    ]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, currentIndex) => currentIndex !== index));
  };

  const updateField = (index: number, patch: Partial<WebhookInputField>) => {
    onChange(fields.map((field, currentIndex) => (currentIndex === index ? { ...field, ...patch } : field)));
  };

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div
          key={field.id || `input-format-${index}`}
          className="space-y-2 rounded-md border border-[var(--node-border)] bg-[var(--surface-3)] p-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Input {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeField(index)}
              className="h-4 w-4 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-4)] transition-colors"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>

          <NodeField label="Name">
            <NodeInput
              placeholder="firstName"
              value={field.name}
              onChange={(e) => updateField(index, { name: e.target.value })}
            />
          </NodeField>

          <NodeField label="Type">
            <NodeSelect
              value={field.type}
              onChange={(e) =>
                updateField(index, {
                  type: e.target.value as WebhookInputField["type"],
                })
              }
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
            </NodeSelect>
          </NodeField>

          <NodeField label="Description">
            <NodeInput
              placeholder="Describe this field"
              value={field.description || ""}
              onChange={(e) => updateField(index, { description: e.target.value })}
            />
          </NodeField>

          <NodeField label="Value">
            <NodeInput
              placeholder="Enter default value"
              value={field.value || ""}
              onChange={(e) => updateField(index, { value: e.target.value })}
            />
          </NodeField>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-[var(--node-border)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--node-border-strong)] transition-colors"
      >
        <PlusIcon className="h-3 w-3" />
        Add input
      </button>
    </div>
  );
}

// ─── Notify editor ────────────────────────────────────────────

type Notif = NonNullable<NotifyNodeData["notifications"]>[number];

const CHANNELS = [
  { value: "discord", label: "Discord", Icon: MessageCircleIcon, color: "#5865F2" },
  { value: "telegram", label: "Telegram", Icon: SendIcon, color: "#26A5E4" },
  { value: "email", label: "Email", Icon: MailIcon, color: "#EA4335" },
  { value: "webhook", label: "Webhook", Icon: WebhookIcon, color: "#6B7280" },
];

const TEMPLATES = ["default", "success", "error", "minimal", "detailed"];

function NotifyEditor({ id, data }: { id: string; data: NotifyNodeData }) {
  const { updateNodeData } = useReactFlow();

  const notifications: Notif[] = data.notifications?.length
    ? data.notifications
    : data.notifyType
    ? [{ notifyType: data.notifyType, template: data.template }]
    : [];

  const setNotifications = useCallback(
    (next: Notif[]) => updateNodeData(id, { notifications: next }),
    [id, updateNodeData]
  );

  const toggle = (type: string) => {
    const exists = notifications.findIndex((n) => n.notifyType === type);
    if (exists >= 0) {
      setNotifications(notifications.filter((_, i) => i !== exists));
    } else {
      setNotifications([...notifications, { notifyType: type, template: "default" }]);
    }
  };

  const update = (i: number, patch: Partial<Notif>) =>
    setNotifications(notifications.map((n, idx) => (idx === i ? { ...n, ...patch } : n)));

  const usedTypes = new Set(notifications.map((n) => n.notifyType));

  return (
    <div className="space-y-3">
      <NodeField label="Channels">
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {CHANNELS.map(({ value, label, Icon, color }) => {
            const active = usedTypes.has(value);
            return (
              <button
                key={value}
                onClick={() => toggle(value)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                  active ? "text-white" : "bg-[var(--surface-4)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]"
                )}
                style={active ? { background: color } : undefined}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            );
          })}
        </div>
      </NodeField>

      {notifications.map((notif, i) => {
        const ch = CHANNELS.find((c) => c.value === notif.notifyType);
        const ChIcon = ch?.Icon ?? BellIcon;
        return (
          <div key={i} className="space-y-2 p-2.5 rounded-md bg-[var(--surface-3)] border border-[var(--node-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ChIcon className="h-3 w-3 text-[var(--text-muted)]" />
                <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                  {ch?.label ?? "Channel"}
                </span>
              </div>
              <button
                onClick={() => setNotifications(notifications.filter((_, idx) => idx !== i))}
                className="h-4 w-4 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-4)] transition-colors"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>

            {(notif.notifyType === "discord" || notif.notifyType === "webhook") && (
              <NodeField label="Webhook URL">
                <NodeInput
                  mono
                  placeholder="https://..."
                  value={notif.webhookUrl || ""}
                  onChange={(e) => update(i, { webhookUrl: e.target.value })}
                />
              </NodeField>
            )}

            {notif.notifyType === "telegram" && (
              <>
                <NodeField label="Bot Token">
                  <NodeInput
                    mono
                    placeholder="Optional — fallback to Dolphinflow default bot"
                    value={notif.telegramBotToken || ""}
                    onChange={(e) => update(i, { telegramBotToken: e.target.value })}
                  />
                </NodeField>
                <NodeField label="Chat ID">
                  <NodeInput
                    mono
                    placeholder="Optional — fallback to Dolphinflow default chat"
                    value={notif.telegramChatId || ""}
                    onChange={(e) => update(i, { telegramChatId: e.target.value })}
                  />
                </NodeField>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Leave these blank to send to Dolphinflow&apos;s default Telegram bot and chat.
                </p>
              </>
            )}

            <NodeField label="Template">
              <NodeSelect
                value={notif.template || "default"}
                onChange={(e) => update(i, { template: e.target.value })}
              >
                {TEMPLATES.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </NodeSelect>
            </NodeField>
          </div>
        );
      })}

      {notifications.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-2">
          Select at least one channel above
        </p>
      )}
    </div>
  );
}

// ─── Toolbar tab ──────────────────────────────────────────────

function ToolbarTab() {
  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="px-3 py-3 space-y-1.5">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
        Toolbar
      </p>
      {PALETTE.map(({ type, label, description, Icon, accent }) => (
        <div
          key={type}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-[var(--surface-3)] transition-colors"
          draggable
          onDragStart={(e) => onDragStart(e, type)}
        >
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ background: accent }}
          >
            <Icon className="h-[14px] w-[14px] text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-[var(--text-primary)] leading-none">
              {label}
            </div>
            <div className="text-[11px] mt-0.5 text-[var(--text-muted)] truncate">
              {description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
