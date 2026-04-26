"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CirclesFourIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import { DarkNav } from "@/components/layout/dark-nav";
import { DeleteModal } from "@/components/ui/delete-modal";
import { useDeleteWorkflow, useToggleWorkflow, useWorkflows } from "@/lib/hooks/use-workflows";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";

// function getTriggerInfo(graph: any) {
//   const triggerNode = graph?.nodes?.find((node: any) => node.type === "trigger");
//   if (!triggerNode) return { type: "Unknown", address: null, icon: "question" };

//   const triggerType = triggerNode.data?.triggerType || "unknown";
//   const config = triggerNode.data?.config || {};

//   const triggerLabels: Record<string, string> = {
//     balance_change: "Balance Change",
//     token_receipt: "Token Receipt",
//     nft_receipt: "NFT Receipt",
//     transaction_status: "Transaction Status",
//     program_log: "Program Log",
//     cron: "Scheduled (Cron)",
//   };

//   return {
//     type: triggerLabels[triggerType] || triggerType,
//     address: config.address || config.programId || config.schedule || null,
//     icon: triggerType,
//   };
// }

// function getActionInfo(graph: any) {
//   const actionNode = graph?.nodes?.find((node: any) => node.type === "action");
//   if (!actionNode) return { type: "No Action", description: null, icon: "none" };

//   const actionType = actionNode.data?.actionType || "unknown";
//   const config = actionNode.data?.config || {};

//   const actionLabels: Record<string, string> = {
//     send_sol: "Send SOL",
//     send_spl_token: "Send Token",
//     call_program: "Call Program",
//     do_nothing: "No Action",
//   };

//   let description = null;
//   if (actionType === "send_sol" && config.toAddress) {
//     description = `To: ${config.toAddress.slice(0, 8)}...`;
//   } else if (actionType === "send_spl_token" && config.tokenMint) {
//     description = `Token: ${config.tokenMint.slice(0, 8)}...`;
//   } else if (actionType === "call_program" && config.programId) {
//     description = `Program: ${config.programId.slice(0, 8)}...`;
//   }

//   return {
//     type: actionLabels[actionType] || actionType,
//     description,
//     icon: actionType,
//   };
// }

// function getNotifyInfo(graph: any) {
//   const notifyNode = graph?.nodes?.find((node: any) => node.type === "notify");
//   if (!notifyNode) return null;

//   const notifyType = notifyNode.data?.notifyType || "unknown";
//   const notifyLabels: Record<string, string> = {
//     discord: "Discord",
//     telegram: "Telegram",
//     slack: "Slack",
//     email: "Email",
//     webhook: "Webhook",
//   };

//   return {
//     type: notifyLabels[notifyType] || notifyType,
//   };
// }

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
      <div className="min-h-screen bg-background text-foreground">
        <DarkNav sticky />

        <main>
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 md:py-14">
            {ready && !authenticated && (
              <StatePanel>
                <div className="mx-auto max-w-xl text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-accent text-[#9945FF]">
                    <WalletIcon size={28} weight="regular" />
                  </div>
                  <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                    Connect your wallet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign in with your wallet to view and manage your automations.
                  </p>
                  <button
                    onClick={login}
                    className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl bg-[#9945FF] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#9945FF]/90"
                  >
                    Connect Wallet
                  </button>
                </div>
              </StatePanel>
            )}

            {error && ready && authenticated && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.08] p-5 text-destructive">
                Error loading workflows: {(error as Error).message}
              </div>
            )}

            {isLoading && ready && authenticated && (
              <StatePanel>
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#9945FF]" />
                  <p className="text-sm text-white/35">Loading workflows...</p>
                </div>
              </StatePanel>
            )}

            {!isLoading && ready && authenticated && !error && (
              <div className="space-y-6">
                <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground md:text-4xl">
                    Workflows
                  </h1>
                  <button
                    onClick={() => router.push("/workflows/builder")}
                    className="inline-flex items-center gap-2 self-start rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
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
                    className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-foreground/[0.02] px-6 py-14 text-center transition-colors hover:bg-foreground/[0.04]"
                  >
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-accent text-muted-foreground">
                      <PlusIcon size={24} weight="regular" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
                      No workflows yet
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Build your first automation in the visual editor.
                    </p>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

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
  // const triggerInfo = getTriggerInfo(workflow.graph);
  // const actionInfo = getActionInfo(workflow.graph);
  // const notifyInfo = getNotifyInfo(workflow.graph);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: icon + name/description */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-accent">
            <WorkflowIcon />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base font-bold tracking-[-0.03em] text-foreground">
                {workflow.name}
              </h2>
              <StatusPill enabled={workflow.enabled} />
            </div>
            {workflow.description && (
              <p className="mt-1 text-sm text-muted-foreground">{workflow.description}</p>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 lg:gap-3">
          <SquareButton title="Edit workflow" onClick={onEdit}>
            <PencilSimpleIcon size={16} weight="regular" />
          </SquareButton>
          <SquareButton title="Delete workflow" onClick={onDelete} danger>
            <TrashIcon size={16} weight="regular" />
          </SquareButton>
          <button
            onClick={onToggle}
            disabled={togglePending}
            className={[
              "rounded-md border px-3 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 min-w-20",
              workflow.enabled
                ? "border-[#9945FF]/20 bg-[#9945FF]/10 text-[#9945FF]"
                : "border-neutral-300 bg-neutral-100 text-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/40",
            ].join(" ")}
          >
            {workflow.enabled ? "Live" : "Paused"}
          </button>
        </div>
      </div>
    </article>
  );
}

function WorkflowIcon() {
  return <CirclesFourIcon size={18} weight="regular" className="text-[#9945FF]" />;
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
        enabled
          ? "border-[#14F195]/20 bg-[#14F195]/10 text-[#14F195]"
          : "border-neutral-300 bg-neutral-100 text-neutral-400 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-white/40",
      ].join(" ")}
    >
      <span
        className={[
          "h-1 w-1 rounded-full",
          enabled ? "bg-[#14F195]" : "bg-neutral-300 dark:bg-white/20",
        ].join(" ")}
      />
      {enabled ? "Live" : "Paused"}
    </span>
  );
}

// function TriggerIcon({ type }: { type: string }) {
//   switch (type) {
//     case "balance_change":
//       return <CurrencyCircleDollarIcon size={20} weight="regular" className="text-sky-600" />;
//     case "token_receipt":
//     case "nft_receipt":
//       return <CubeIcon size={20} weight="regular" className="text-sky-600" />;
//     case "program_log":
//       return <BroadcastIcon size={20} weight="regular" className="text-sky-600" />;
//     case "cron":
//       return <ClockIcon size={20} weight="regular" className="text-sky-600" />;
//     default:
//       return <CirclesFourIcon size={20} weight="regular" className="text-sky-600" />;
//   }
// }

// function ActionIcon({ type }: { type: string }) {
//   switch (type) {
//     case "send_sol":
//       return (
//         <CurrencyCircleDollarIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />
//       );
//     case "send_spl_token":
//       return <CubeIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />;
//     case "call_program":
//       return <BroadcastIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />;
//     default:
//       return <LightningIcon size={20} weight="regular" style={{ color: "var(--brand)" }} />;
//   }
// }

function StatePanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-12 text-center">{children}</div>
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
      className={[
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
        danger
          ? "border-destructive/20 bg-accent text-destructive hover:bg-destructive/[0.08]"
          : "border-border bg-accent text-muted-foreground hover:bg-muted",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
