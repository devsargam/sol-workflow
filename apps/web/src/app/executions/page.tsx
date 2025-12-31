"use client";

import { useExecutions } from "@/lib/hooks/use-executions";
import { useWorkflows } from "@/lib/hooks/use-workflows";

export default function ExecutionsPage() {
  const { data: executionsData, isLoading, error } = useExecutions();
  const { data: workflowsData } = useWorkflows();

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflowsData?.workflows?.find((w) => w.id === workflowId);
    return workflow?.name || "Unknown";
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "success":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          icon: "✓",
        };
      case "failed":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          text: "text-red-700",
          icon: "✗",
        };
      case "filtered":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          text: "text-yellow-700",
          icon: "⊘",
        };
      case "processing":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          icon: "⟳",
        };
      default:
        return {
          bg: "bg-neutral-50",
          border: "border-neutral-200",
          text: "text-neutral-700",
          icon: "○",
        };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Execution History</h1>
        <p className="text-neutral-600 text-lg">
          Track all workflow executions and their results
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
          <div className="inline-flex items-center gap-2 text-neutral-600">
            <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            <span>Loading executions...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-600">
            Error loading executions: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Empty State */}
      {executionsData?.executions && executionsData.executions.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <div className="max-w-sm mx-auto">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No executions yet</h3>
            <p className="text-neutral-600">
              Create and enable a workflow to start monitoring
            </p>
          </div>
        </div>
      )}

      {/* Executions List */}
      {executionsData?.executions && executionsData.executions.length > 0 && (
        <div className="space-y-3">
          {executionsData.executions.map((execution) => {
            const statusConfig = getStatusConfig(execution.status);

            return (
              <div
                key={execution.id}
                className="rounded-xl border border-neutral-200 bg-white p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}
                      >
                        {statusConfig.icon} {execution.status}
                      </span>
                      <span className="text-sm font-semibold">
                        {getWorkflowName(execution.workflowId)}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-500">
                      ID: {execution.executionId}
                    </p>
                  </div>
                  <div className="text-right text-xs text-neutral-500">
                    {new Date(execution.startedAt).toLocaleString()}
                  </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Trigger Data */}
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                      Trigger Data
                    </p>
                    <pre className="text-xs bg-neutral-50 border border-neutral-200 p-3 rounded-lg overflow-x-auto font-mono">
                      {JSON.stringify(execution.triggerData, null, 2)}
                    </pre>
                  </div>

                  {/* Execution Details */}
                  <div className="space-y-3">
                    {/* Transaction */}
                    {execution.txSignature && (
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                          Transaction
                        </p>
                        <a
                          href={`https://solscan.io/tx/${execution.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-mono text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View on Solscan
                        </a>
                      </div>
                    )}

                    {/* Error */}
                    {execution.txError && (
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                          Error
                        </p>
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                          {execution.txError}
                        </p>
                      </div>
                    )}

                    {/* Notification Success */}
                    {execution.notificationSent && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>
                          Notification sent at{" "}
                          {new Date(execution.notificationSent).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {/* Notification Error */}
                    {execution.notificationError && (
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                          Notification Error
                        </p>
                        <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          {execution.notificationError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                {execution.completedAt && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      Completed: {new Date(execution.completedAt).toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 rounded font-mono">
                      {Math.round(
                        (new Date(execution.completedAt).getTime() -
                          new Date(execution.startedAt).getTime()) /
                          1000
                      )}s
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
