"use client";

import { useState } from "react";
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

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-start mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Workflows</h1>
            <p className="text-neutral-600 text-lg">
              Monitor Solana wallets and automate on-chain actions
            </p>
          </div>
          <button
            onClick={() => (window.location.href = "/workflows/builder")}
            className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
            <div className="inline-flex items-center gap-2 text-neutral-600">
              <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
              <span>Loading workflows...</span>
            </div>
          </div>
        )}

        {error && (
          <>
            {ready && !authenticated ? (
              <AuthError
                message="Please log in to view your workflows."
                onRetry={() => window.location.reload()}
              />
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <p className="text-red-600">Error loading workflows: {(error as Error).message}</p>
              </div>
            )}
          </>
        )}

        {data?.workflows && data.workflows.length === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-neutral-400"
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
              </div>
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-neutral-600 mb-4">
                Create your first workflow with our visual builder
              </p>
              <button
                onClick={() => (window.location.href = "/workflows/builder")}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          </div>
        )}

        {data?.workflows && data.workflows.length > 0 && (
          <div className="space-y-4">
            {data.workflows.map((workflow: any) => (
              <div
                key={workflow.id}
                className="rounded-xl border border-neutral-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{workflow.name}</h3>
                    {workflow.description && (
                      <p className="text-sm text-neutral-600">{workflow.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        (window.location.href = `/workflows/builder?edit=${workflow.id}`)
                      }
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
                      title="Edit workflow"
                    >
                      <svg
                        className="w-4 h-4 text-neutral-600 group-hover:text-neutral-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick({ id: workflow.id, name: workflow.name })}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                      title="Delete workflow"
                    >
                      <svg
                        className="w-4 h-4 text-neutral-600 group-hover:text-red-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleWorkflow.mutate(workflow.id)}
                      disabled={toggleWorkflow.isPending}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        workflow.enabled
                          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          : "bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200"
                      }`}
                    >
                      {workflow.enabled ? "● Active" : "○ Disabled"}
                    </button>
                  </div>
                </div>

                <WorkflowDetails graph={workflow.graph} />

                <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                  Created {new Date(workflow.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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

// Component to display workflow trigger and action details
function WorkflowDetails({ graph }: { graph: any }) {
  const triggerInfo = getTriggerInfo(graph);
  const actionInfo = getActionInfo(graph);
  const notifyInfo = getNotifyInfo(graph);

  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Trigger</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <TriggerIcon type={triggerInfo.icon} />
          </div>
          <div>
            <p className="text-sm font-medium">{triggerInfo.type}</p>
            {triggerInfo.address && (
              <p className="text-xs font-mono text-neutral-500 truncate max-w-[200px]">
                {triggerInfo.address}
              </p>
            )}
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Action</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <ActionIcon type={actionInfo.icon} />
          </div>
          <div>
            <p className="text-sm font-medium">{actionInfo.type}</p>
            <p className="text-xs text-neutral-500">
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
          className="w-4 h-4 text-blue-600"
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
          className="w-4 h-4 text-blue-600"
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
          className="w-4 h-4 text-blue-600"
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
          className="w-4 h-4 text-blue-600"
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
          className="w-4 h-4 text-blue-600"
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
          className="w-4 h-4 text-purple-600"
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
          className="w-4 h-4 text-purple-600"
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
          className="w-4 h-4 text-purple-600"
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
          className="w-4 h-4 text-purple-600"
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
