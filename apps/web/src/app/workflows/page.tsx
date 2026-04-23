"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BroadcastIcon,
  CirclesFourIcon,
  ClockIcon,
  CubeIcon,
  CurrencyCircleDollarIcon,
  LightningIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/header";
import { DeleteModal } from "@/components/ui/delete-modal";
import { useDeleteWorkflow, useToggleWorkflow, useWorkflows } from "@/lib/hooks/use-workflows";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function WorkflowPageTitle() {
  return (
    <div>
      <h1
        className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-4xl"
        style={{ color: "var(--text-primary)" }}
      >
        All workflows
      </h1>
    </div>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const { authenticated, ready, login } = useWalletAuth();
  const { data, isLoading, error } = useWorkflows();
  const deleteWorkflowMutation = useDeleteWorkflow();
  const toggleWorkflow = useToggleWorkflow();
  const [workflowToDelete, setWorkflowToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const workflows = data?.workflows ?? [];

  const handleDeleteConfirm = () => {
    if (!workflowToDelete) return;

    deleteWorkflowMutation.mutate(workflowToDelete.id, {
      onSuccess: () => {
        setWorkflowToDelete(null);
      },
    });
  };

  return (
    <>
      <Header />
      <main style={{ backgroundColor: "var(--canvas-bg)" }}>
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          {ready && !authenticated && (
            <StatePanel>
              <div className="mx-auto max-w-xl text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border"
                  style={{
                    background: "var(--surface-1)",
                    borderColor: "var(--node-border)",
                    color: "var(--brand)",
                  }}
                >
                  <WalletIcon size={28} weight="regular" />
                </div>
                <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  Connect your wallet to load your workflows
                </h3>
                <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Wallet auth is still the account layer, but this page stays focused on your
                  workflow library.
                </p>
                <button
                  onClick={login}
                  className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white"
                  style={{ background: "var(--brand)" }}
                >
                  Connect Wallet
                </button>
              </div>
            </StatePanel>
          )}

          {error && ready && authenticated && (
            <div
              className="rounded-[20px] border p-5"
              style={{
                background: "#fef2f2",
                borderColor: "#fecaca",
                color: "#b91c1c",
              }}
            >
              Error loading workflows: {(error as Error).message}
            </div>
          )}

          {isLoading && ready && authenticated && (
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

          {!isLoading && ready && authenticated && !error && (
            <div className="space-y-6">
              <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <WorkflowPageTitle />
                <button
                  onClick={() => router.push("/workflows/builder")}
                  className="inline-flex items-center gap-2 self-start rounded-xl border px-5 py-3 text-sm font-medium"
                  style={{
                    background: "white",
                    borderColor: "var(--node-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <PlusIcon size={16} weight="bold" />
                  New workflow
                </button>
              </section>

              {workflows.map((workflow: any) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  onEdit={() => router.push(`/workflows/builder?edit=${workflow.id}`)}
                  onDelete={() => setWorkflowToDelete({ id: workflow.id, name: workflow.name })}
                  onToggle={() => toggleWorkflow.mutate(workflow.id)}
                  togglePending={toggleWorkflow.isPending}
                />
              ))}

              {workflows.length === 0 && (
                <button
                  onClick={() => router.push("/workflows/builder")}
                  className="flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-12 text-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.55)",
                    borderColor: "rgba(23, 23, 23, 0.14)",
                  }}
                >
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border"
                    style={{
                      background: "white",
                      borderColor: "rgba(23, 23, 23, 0.12)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <PlusIcon size={24} weight="regular" />
                  </div>
                  <h3
                    className="text-2xl font-semibold tracking-[-0.03em]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {workflows.length > 0
                      ? "Create another workflow"
                      : "Create your first workflow"}
                  </h3>
                  <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
                    Start from scratch in the visual builder.
                  </p>
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <DeleteModal
        isOpen={!!workflowToDelete}
        onClose={() => setWorkflowToDelete(null)}
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

function WorkflowCard({
  workflow,
  onEdit,
  onDelete,
  onToggle,
  togglePending,
}: {
  workflow: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  togglePending: boolean;
}) {
  const triggerInfo = getTriggerInfo(workflow.graph);
  const actionInfo = getActionInfo(workflow.graph);
  const notifyInfo = getNotifyInfo(workflow.graph);

  return (
    <article
      className="rounded-[24px] border p-6"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderColor: "var(--node-border)",
      }}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center min-w-0 flex-1 gap-4">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border"
              style={{
                background: "var(--surface-1)",
                borderColor: "var(--node-border)",
              }}
            >
              <WorkflowIcon />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  className="text-lg font-semibold tracking-[-0.03em]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {workflow.name}
                </h2>
                <StatusPill enabled={workflow.enabled} />
              </div>
              {workflow.description && (
                <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
                  {workflow.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SquareButton title="Edit workflow" onClick={onEdit}>
              <PencilSimpleIcon size={20} weight="regular" />
            </SquareButton>
            <SquareButton title="Delete workflow" onClick={onDelete} danger>
              <TrashIcon size={20} weight="regular" />
            </SquareButton>
            <button
              onClick={onToggle}
              disabled={togglePending}
              className="rounded-md border px-4 py-1 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: workflow.enabled ? "var(--brand-alpha)" : "white",
                borderColor: workflow.enabled ? "rgba(153, 69, 255, 0.18)" : "var(--node-border)",
                color: workflow.enabled ? "var(--brand)" : "var(--text-secondary)",
              }}
            >
              {workflow.enabled ? "Live" : "Paused"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function WorkflowIcon() {
  return <CirclesFourIcon size={28} weight="regular" style={{ color: "var(--brand)" }} />;
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs"
      style={{
        background: enabled ? "rgba(34, 197, 94, 0.08)" : "var(--surface-1)",
        borderColor: enabled ? "rgba(34, 197, 94, 0.16)" : "var(--node-border)",
        color: enabled ? "#15803d" : "var(--text-secondary)",
      }}
    >
      <span
        className="h-1 w-1 rounded-full text-xs"
        style={{ background: enabled ? "#22c55e" : "rgba(23, 23, 23, 0.24)" }}
      />
      {enabled ? "Live" : "Paused"}
    </span>
  );
}

function TriggerIcon({ type }: { type: string }) {
  switch (type) {
    case "balance_change":
      return <CurrencyCircleDollarIcon size={20} weight="regular" className="text-sky-600" />;
    case "token_receipt":
    case "nft_receipt":
      return <CubeIcon size={20} weight="regular" className="text-sky-600" />;
    case "program_log":
      return <BroadcastIcon size={20} weight="regular" className="text-sky-600" />;
    case "cron":
      return <ClockIcon size={20} weight="regular" className="text-sky-600" />;
    default:
      return <CirclesFourIcon size={20} weight="regular" className="text-sky-600" />;
  }
}

function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case "send_sol":
      return (
        <CurrencyCircleDollarIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />
      );
    case "send_spl_token":
      return <CubeIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />;
    case "call_program":
      return <BroadcastIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />;
    default:
      return <LightningIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />;
  }
}

function StatePanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[24px] border p-12 text-center"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        borderColor: "var(--node-border)",
      }}
    >
      {children}
    </div>
  );
}

function SquareButton({
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
      className="flex h-8 w-8 items-center justify-center rounded-md border"
      style={{
        background: "white",
        borderColor: danger ? "rgba(239, 68, 68, 0.18)" : "var(--node-border)",
        color: danger ? "#b91c1c" : "var(--text-secondary)",
      }}
    >
      {children}
    </button>
  );
}
