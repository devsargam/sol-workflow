"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Header } from "@/components/layout/header";
import { DeleteModal } from "@/components/ui/delete-modal";
import { AuthError } from "@/components/ui/auth-error";
import { useDeleteWorkflow, useToggleWorkflow, useWorkflows } from "@/lib/hooks/use-workflows";
import { motion } from "framer-motion";

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
    kalshi_place_order: "Kalshi Place Order",
  };

  let description = null;
  if (actionType === "send_sol" && config.toAddress) {
    description = `To: ${config.toAddress.slice(0, 8)}...`;
  } else if (actionType === "send_spl_token" && config.tokenMint) {
    description = `Token: ${config.tokenMint.slice(0, 8)}...`;
  } else if (actionType === "call_program" && config.programId) {
    description = `Program: ${config.programId.slice(0, 8)}...`;
  } else if (actionType === "kalshi_place_order" && config.marketId) {
    description = `Market: ${config.marketId.slice(0, 8)}...`;
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
      <main>
        <section className="max-w-[1000px] mx-auto border-x border-black">
          <div className="w-full border-b border-black p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl md:text-5xl font-dynapuff font-bold tracking-tight mb-3"
                >
                  Workflows
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-neutral-600 text-lg"
                >
                  Monitor Solana wallets and automate on-chain actions
                </motion.p>
              </div>
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (window.location.href = "/workflows/builder")}
                className="px-6 py-3 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
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
              </motion.button>
            </div>
          </div>

          {isLoading && (
            <div className="w-full border-b border-black p-12 text-center">
              <div className="inline-flex items-center gap-2 text-neutral-600">
                <div className="w-4 h-4 border-2 border-neutral-300 border-t-black animate-spin" />
                <span>Loading workflows...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="w-full border-b border-black">
              {ready && !authenticated ? (
                <div className="p-8">
                  <AuthError
                    message="Please log in to view your workflows."
                    onRetry={() => window.location.reload()}
                  />
                </div>
              ) : (
                <div className="p-8 bg-red-50 border-b border-black">
                  <p className="text-red-600">
                    Error loading workflows: {(error as Error).message}
                  </p>
                </div>
              )}
            </div>
          )}

          {data?.workflows && data.workflows.length === 0 && (
            <div className="w-full border-b border-black p-12 text-center">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-neutral-100 flex items-center justify-center mx-auto mb-4">
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
                  className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
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
            <div className="w-full">
              {data.workflows.map((workflow: any, index: number) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`w-full border-b border-black ${
                    index === data.workflows.length - 1 ? "" : ""
                  }`}
                >
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{workflow.name}</h3>
                        {workflow.description && (
                          <p className="text-sm text-neutral-600">{workflow.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/workflows/builder?edit=${workflow.id}`)
                          }
                          className="p-2 hover:bg-neutral-100 transition-colors group"
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
                          onClick={() =>
                            handleDeleteClick({ id: workflow.id, name: workflow.name })
                          }
                          className="p-2 hover:bg-red-100 transition-colors group"
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
                          className={`px-4 py-2 text-sm font-medium transition-all border ${
                            workflow.enabled
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200"
                          }`}
                        >
                          {workflow.enabled ? "● Active" : "○ Disabled"}
                        </button>
                      </div>
                    </div>

                    <WorkflowDetails graph={workflow.graph} />

                    <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500">
                      Created {new Date(workflow.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="border border-neutral-200 p-4">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Trigger</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-200">
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
      <div className="border border-neutral-200 p-4">
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Action</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center border border-purple-200">
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
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path d="M12 6v12M9 9h6M9 15h6" stroke="currentColor" strokeWidth="2.5" />
          <path
            d="M12 6c0-1.5-1.5-3-3-3s-3 1.5-3 3M12 18c0 1.5 1.5 3 3 3s3-1.5 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      );
    case "token_receipt":
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path d="M8 12h8M12 8v8M16 8l-4 4-4-4" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "nft_receipt":
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <rect x="8" y="8" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
          <path d="M8 8l4 4M12 12l4-4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "program_log":
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path d="M8 10h8M8 14h8M8 18h5" stroke="currentColor" strokeWidth="2" />
          <path d="M10 6h4v2h-4z" fill="currentColor" fillOpacity="0.3" />
        </svg>
      );
    case "cron":
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
}

function ActionIcon({ type }: { type: string }) {
  switch (type) {
    case "send_sol":
      return (
        <svg
          className="w-5 h-5 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path d="M12 4l-8 8 8 8 8-8-8-8z" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 12v8" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "send_spl_token":
      return (
        <svg
          className="w-5 h-5 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "call_program":
      return (
        <svg
          className="w-5 h-5 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path d="M8 12l4-4 4 4M8 12l4 4 4-4" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "kalshi_place_order":
      return (
        <svg
          className="w-5 h-5 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-5 h-5 text-purple-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.1" />
          <path
            d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
      );
  }
}
