"use client";

import { useWorkflows, useToggleWorkflow } from "@/lib/hooks/use-workflows";

export default function WorkflowsPage() {
  const { data, isLoading, error } = useWorkflows();
  const toggleWorkflow = useToggleWorkflow();

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Workflows</h1>
          <p className="text-neutral-600 text-lg">
            Monitor Solana wallets and automate on-chain actions
          </p>
        </div>
        <button
          onClick={() => window.location.href = "/workflows/builder"}
          className="px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Workflow
        </button>
      </div>


      {/* Loading State */}
      {isLoading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
          <div className="inline-flex items-center gap-2 text-neutral-600">
            <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            <span>Loading workflows...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-600">Error loading workflows: {(error as Error).message}</p>
        </div>
      )}

      {/* Empty State */}
      {data?.workflows && data.workflows.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-neutral-600 mb-4">
              Create your first workflow with our visual builder
            </p>
            <button
              onClick={() => window.location.href = "/workflows/builder"}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Open Visual Builder
            </button>
          </div>
        </div>
      )}

      {/* Workflows List */}
      {data?.workflows && data.workflows.length > 0 && (
        <div className="space-y-4">
          {data.workflows.map((workflow) => (
            <div key={workflow.id} className="rounded-xl border border-neutral-200 bg-white p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{workflow.name}</h3>
                  {workflow.description && (
                    <p className="text-sm text-neutral-600">{workflow.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.location.href = `/workflows/builder?edit=${workflow.id}`}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
                    title="Edit workflow"
                  >
                    <svg className="w-4 h-4 text-neutral-600 group-hover:text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

              {/* Workflow Details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Trigger</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Balance Change</p>
                      <p className="text-xs font-mono text-neutral-500 truncate max-w-[200px]">
                        {workflow.triggerConfig?.address}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Action</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Send SOL</p>
                      <p className="text-xs text-neutral-500">Automated transfer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                Created {new Date(workflow.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
