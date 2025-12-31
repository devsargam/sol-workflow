"use client";

import { useWorkflows, useToggleWorkflow } from "@/lib/hooks/use-workflows";
import { BalanceChecker } from "@/components/balance-checker";

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

      {/* Create Form */}
      {showForm && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Create Workflow</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">
                Workflow Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="My Wallet Monitor"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">
                Description <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="Alert me when balance changes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">
                Solana Wallet Address
              </label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="7xKXp7Yh9V5L8ZqN3J6yW2X9F4vK5mR8nT3pQ1cD6bA2"
                required
                pattern="[1-9A-HJ-NP-Za-km-z]{32,44}"
              />
              <p className="text-xs text-neutral-500 mt-1.5">
                The wallet address to monitor for balance changes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-neutral-700">
                Discord Webhook URL
              </label>
              <input
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                placeholder="https://discord.com/api/webhooks/..."
                required
              />
              <p className="text-xs text-neutral-500 mt-1.5">
                Get from: Server Settings → Integrations → Webhooks
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createWorkflow.isPending}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {createWorkflow.isPending ? "Creating..." : "Create Workflow"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            {createWorkflow.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  Error: {(createWorkflow.error as Error).message}
                </p>
              </div>
            )}
          </form>
        </div>
      )}

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
      {data?.workflows && data.workflows.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
            <p className="text-neutral-600 mb-4">
              Create your first workflow to start monitoring Solana wallets
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
            >
              Create Workflow
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

              {/* Balance Display */}
              {workflow.enabled && workflow.triggerConfig?.address && (
                <div className="mb-6">
                  <BalanceChecker address={workflow.triggerConfig.address} />
                </div>
              )}

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
