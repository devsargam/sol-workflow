"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Header } from "@/components/layout/header";
import { DeleteModal } from "@/components/ui/delete-modal";
import { AuthError } from "@/components/ui/auth-error";
import { useDeleteWorkflow, useToggleWorkflow, useWorkflows } from "@/lib/hooks/use-workflows";

// Helper to get trigger info from workflow graph
function getTriggerInfo(graph: any) {
  const triggerNode = graph?.nodes?.find((node: any) => node.type === "trigger");
  if (!triggerNode) return { type: "Unknown", address: null, icon: "question" };

  const triggerType = triggerNode.data?.triggerType || "unknown";
  const config = triggerNode.data?.config || {};

  const triggerLabels: Record<string, string> = {
    balance_change: "Balance Change",
    token_receipt: "Token Receipt",
    nft_receipt: "NFT Receipt",
    transaction_status: "Transaction Status",
    program_log: "Program Log",
    cron: "Scheduled (Cron)",
  };

  return {
    type: triggerLabels[triggerType] || triggerType,
    address: config.address || config.programId || config.schedule || null,
    icon: triggerType,
  };
}

// Helper to get action info from workflow graph
function getActionInfo(graph: any) {
  const actionNode = graph?.nodes?.find((node: any) => node.type === "action");
  if (!actionNode) return { type: "No Action", description: null, icon: "none" };

  const actionType = actionNode.data?.actionType || "unknown";
  const config = actionNode.data?.config || {};

  const actionLabels: Record<string, string> = {
    send_sol: "Send SOL",
    send_spl_token: "Send Token",
    call_program: "Call Program",
    do_nothing: "No Action",
  };

  let description = null;
  if (actionType === "send_sol" && config.toAddress) {
    description = `To: ${config.toAddress.slice(0, 8)}...`;
  } else if (actionType === "send_spl_token" && config.tokenMint) {
    description = `Token: ${config.tokenMint.slice(0, 8)}...`;
  } else if (actionType === "call_program" && config.programId) {
    description = `Program: ${config.programId.slice(0, 8)}...`;
  }

  return {
    type: actionLabels[actionType] || actionType,
    description,
    icon: actionType,
  };
}

// Helper to get notification info from workflow graph
function getNotifyInfo(graph: any) {
  const notifyNode = graph?.nodes?.find((node: any) => node.type === "notify");
  if (!notifyNode) return null;

  const notifyType = notifyNode.data?.notifyType || "unknown";
  const notifyLabels: Record<string, string> = {
    discord: "Discord",
    telegram: "Telegram",
    slack: "Slack",
    email: "Email",
    webhook: "Webhook",
  };

  return {
    type: notifyLabels[notifyType] || notifyType,
  };
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();
  const { data, isLoading, error } = useWorkflows();
  const deleteWorkflowMutation = useDeleteWorkflow();
  const toggleWorkflow = useToggleWorkflow();
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleDeleteClick = (workflow: { id: string; name: string }) => {
    setWorkflowToDelete(workflow);
  };

  const handleDeleteConfirm = () => {
    if (workflowToDelete) {
      deleteWorkflowMutation.mutate(workflowToDelete.id, {
        onSuccess: () => {
          setWorkflowToDelete(null);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setWorkflowToDelete(null);
  };

  const workflows = data?.workflows ?? [];
  const activeWorkflowCount = workflows.filter((workflow: any) => workflow.enabled).length;

  return (
    <>
      <Header />
      <div
        className="relative min-h-[calc(100vh-72px)] overflow-hidden"
        style={{
          backgroundColor: "var(--canvas-bg)",
          backgroundImage: `
            radial-gradient(circle at top left, var(--brand-alpha), transparent 28%),
            radial-gradient(circle at top right, rgba(23, 23, 23, 0.04), transparent 22%)
          `,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--node-border) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.28), transparent 80%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-8 md:py-10">
          <section
            className="mb-8 rounded-[28px] border p-8 md:p-10"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 248, 248, 0.98) 100%)",
              borderColor: "var(--node-border)",
              boxShadow: "0 24px 80px rgba(23, 23, 23, 0.06)",
            }}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]"
                  style={{
                    background: "var(--surface-1)",
                    borderColor: "var(--node-border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Workflow Canvas
                </div>
                <h1
                  className="text-4xl font-semibold tracking-[-0.04em] md:text-5xl"
                  style={{ color: "var(--text-primary)" }}
                >
                  Workflows
                </h1>
                <p
                  className="mt-3 max-w-xl text-base md:text-lg"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Monitor Solana wallets, route on-chain activity, and manage every automation
                  from the same visual system as the builder.
                </p>
              </div>

              <div className="flex flex-col gap-4 lg:items-end">
                <div className="flex flex-wrap gap-3">
                  <MetricCard label="Total" value={String(workflows.length)} />
                  <MetricCard label="Active" value={String(activeWorkflowCount)} />
                </div>
                <button
                  onClick={() => router.push("/workflows/builder")}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  style={{
                    background: "var(--brand)",
                    boxShadow: "0 12px 30px rgba(153, 69, 255, 0.25)",
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Workflow
                </button>
              </div>
            </div>
          </section>

          {isLoading && (
            <StatePanel>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2"
                  style={{
                    borderColor: "var(--node-border)",
                    borderTopColor: "var(--brand)",
                  }}
                />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Loading workflows...
                </p>
              </div>
            </StatePanel>
          )}

          {error && (
            <>
              {ready && !authenticated ? (
                <AuthError
                  message="Please log in to view your workflows."
                  onRetry={() => window.location.reload()}
                />
              ) : (
                <div
                  className="rounded-[24px] border p-6"
                  style={{
                    background: "rgba(254, 242, 242, 0.95)",
                    borderColor: "rgba(239, 68, 68, 0.18)",
                    color: "#b91c1c",
                  }}
                >
                  <p>Error loading workflows: {(error as Error).message}</p>
                </div>
              )}
            </>
          )}

          {!isLoading && !error && workflows.length === 0 && (
            <StatePanel>
              <div className="mx-auto max-w-sm text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border"
                  style={{
                    background: "var(--surface-1)",
                    borderColor: "var(--node-border)",
                    color: "var(--brand)",
                  }}
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  No workflows yet
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Start with the visual builder and your automations will show up here in the
                  same canvas-inspired layout.
                </p>
                <button
                  onClick={() => router.push("/workflows/builder")}
                  className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  style={{
                    background: "var(--brand)",
                    boxShadow: "0 12px 30px rgba(153, 69, 255, 0.22)",
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Open Visual Builder
                </button>
              </div>
            </StatePanel>
          )}

          {!isLoading && !error && workflows.length > 0 && (
            <div className="space-y-4">
              {workflows.map((workflow: any) => (
                <article
                  key={workflow.id}
                  className="rounded-[24px] border p-6 md:p-7"
                  style={{
                    background: "rgba(255, 255, 255, 0.94)",
                    borderColor: "var(--node-border)",
                    boxShadow: "0 16px 48px rgba(23, 23, 23, 0.05)",
                  }}
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3
                            className="text-xl font-semibold tracking-[-0.02em]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {workflow.name}
                          </h3>
                          <span
                            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                            style={{
                              background: workflow.enabled
                                ? "var(--brand-alpha)"
                                : "var(--surface-1)",
                              borderColor: workflow.enabled
                                ? "rgba(153, 69, 255, 0.16)"
                                : "var(--node-border)",
                              color: workflow.enabled ? "var(--brand)" : "var(--text-secondary)",
                            }}
                          >
                            {workflow.enabled ? "Live" : "Paused"}
                          </span>
                        </div>
                        {workflow.description && (
                          <p
                            className="max-w-2xl text-sm md:text-base"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {workflow.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <IconButton
                          title="Edit workflow"
                          onClick={() => router.push(`/workflows/builder?edit=${workflow.id}`)}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </IconButton>
                        <IconButton
                          title="Delete workflow"
                          onClick={() => handleDeleteClick({ id: workflow.id, name: workflow.name })}
                          danger
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </IconButton>
                        <button
                          onClick={() => toggleWorkflow.mutate(workflow.id)}
                          disabled={toggleWorkflow.isPending}
                          className="rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            background: workflow.enabled ? "var(--brand-alpha)" : "var(--surface-1)",
                            borderColor: workflow.enabled
                              ? "rgba(153, 69, 255, 0.16)"
                              : "var(--node-border)",
                            color: workflow.enabled ? "var(--brand)" : "var(--text-secondary)",
                          }}
                        >
                          {workflow.enabled ? "● Active" : "○ Disabled"}
                        </button>
                      </div>
                    </div>

                    <WorkflowDetails graph={workflow.graph} />

                    <div
                      className="flex flex-col gap-2 border-t pt-4 text-xs md:flex-row md:items-center md:justify-between"
                      style={{ borderColor: "var(--node-border)", color: "var(--text-muted)" }}
                    >
                      <span>Created {formatDate(workflow.createdAt)}</span>
                      <span>Visual automation graph ready for editing</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={!!workflowToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Workflow"
        description={
          workflowToDelete
            ? `Are you sure you want to delete "${workflowToDelete.name}"? This action cannot be undone.`
            : ""
        }
        isLoading={deleteWorkflowMutation.isPending}
      />
    </>
  );
}

function WorkflowDetails({ graph }: { graph: any }) {
  const triggerInfo = getTriggerInfo(graph);
  const actionInfo = getActionInfo(graph);
  const notifyInfo = getNotifyInfo(graph);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div
        className="rounded-2xl border p-4"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--node-border)",
        }}
      >
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-muted)" }}
        >
          Trigger
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--node-border)",
            }}
          >
            <TriggerIcon type={triggerInfo.icon} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {triggerInfo.type}
            </p>
            {triggerInfo.address && (
              <p
                className="max-w-[220px] truncate font-mono text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {triggerInfo.address}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--node-border)",
        }}
      >
        <p
          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "var(--text-muted)" }}
        >
          Action
        </p>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{
              background: "var(--brand-alpha)",
              borderColor: "rgba(153, 69, 255, 0.14)",
            }}
          >
            <ActionIcon type={actionInfo.icon} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {actionInfo.type}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {actionInfo.description ||
                (notifyInfo ? `+ ${notifyInfo.type} notification` : "Automated")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TriggerIcon({ type }: { type: string }) {
  switch (type) {
    case "balance_change":
      return (
        <svg
          className="h-4 w-4 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "token_receipt":
    case "nft_receipt":
      return (
        <svg
          className="h-4 w-4 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      );
    case "program_log":
      return (
        <svg
          className="h-4 w-4 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "cron":
      return (
        <svg
          className="h-4 w-4 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="h-4 w-4 text-sky-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      );
  }
}

function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case "send_sol":
      return (
        <svg
          className="h-4 w-4"
          style={{ color: "var(--brand)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      );
    case "send_spl_token":
      return (
        <svg
          className="h-4 w-4"
          style={{ color: "var(--brand)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      );
    case "call_program":
      return (
        <svg
          className="h-4 w-4"
          style={{ color: "var(--brand)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="h-4 w-4"
          style={{ color: "var(--brand)" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
  }
}

function StatePanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[24px] border p-12 text-center"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderColor: "var(--node-border)",
        boxShadow: "0 20px 60px rgba(23, 23, 23, 0.05)",
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="min-w-[108px] rounded-2xl border px-4 py-3"
      style={{
        background: "rgba(255, 255, 255, 0.82)",
        borderColor: "var(--node-border)",
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-semibold tracking-[-0.04em]"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function IconButton({
  children,
  danger = false,
  onClick,
  title,
}: {
  children: ReactNode;
  danger?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-xl border p-2.5 transition-colors"
      style={{
        background: danger ? "rgba(254, 242, 242, 0.88)" : "var(--surface-1)",
        borderColor: danger ? "rgba(239, 68, 68, 0.14)" : "var(--node-border)",
        color: danger ? "#b91c1c" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
