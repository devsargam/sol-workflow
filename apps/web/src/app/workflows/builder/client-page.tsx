"use client";

import { WorkflowBuilderContent } from "@/components/workflow-builder/WorkflowBuilderWithSave";
import { useCreateWorkflow, useUpdateWorkflow, useWorkflow } from "@/lib/hooks/use-workflows";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function WorkflowBuilderClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } = useWorkflow(editId || "");

  const builderRef = useRef<any>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

  // Load existing workflow data when editing
  useEffect(() => {
    if (existingWorkflow?.workflow) {
      const workflow = existingWorkflow.workflow;
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || "");

      // Load the workflow graph into the visual builder
      if (builderRef.current && workflow.graph) {
        // Load the graph directly
        builderRef.current.loadWorkflow(workflow.graph);
      }
    }
  }, [existingWorkflow]);

  const validateWorkflowGraph = (graph: any) => {
    const errors: string[] = [];

    // Must have at least one trigger node
    const triggerNodes = graph.nodes.filter((n: any) => n.type === "trigger");
    if (triggerNodes.length === 0) {
      errors.push("Workflow must have at least one trigger node");
    }

    // Validate trigger nodes
    for (const trigger of triggerNodes) {
      const config = trigger.data?.config || {};
      if (trigger.data?.triggerType === "balance_change" && !config.address) {
        errors.push(`Trigger node ${trigger.id}: Wallet address is required`);
      }
    }

    // Must have at least one action node
    const actionNodes = graph.nodes.filter((n: any) => n.type === "action");
    if (actionNodes.length === 0) {
      errors.push("Workflow must have at least one action node");
    }

    // Validate action nodes
    for (const action of actionNodes) {
      const config = action.data?.config || {};
      if (action.data?.actionType === "send_sol") {
        if (!config.toAddress) {
          errors.push(`Action node ${action.id}: Recipient address is required`);
        }
        if (!config.amount) {
          errors.push(`Action node ${action.id}: Amount is required`);
        }
      }
    }

    // Validate notify nodes
    const notifyNodes = graph.nodes.filter((n: any) => n.type === "notify");
    for (const notify of notifyNodes) {
      if (notify.data?.notifyType === "discord" && !notify.data?.webhookUrl) {
        errors.push(`Notify node ${notify.id}: Discord webhook URL is required`);
      }
    }

    return errors;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrors([]);
    setShowErrors(false);

    try {
      // Get workflow graph from React Flow
      const graph = builderRef.current?.getWorkflowData();

      if (!graph) {
        setErrors(["Unable to extract workflow graph"]);
        setShowErrors(true);
        setIsSaving(false);
        return;
      }

      // Validate the workflow graph
      const validationErrors = validateWorkflowGraph(graph);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setShowErrors(true);
        setIsSaving(false);
        return;
      }

      // Use "Untitled workflow" if no name is provided
      const finalWorkflowName = workflowName.trim() || "Untitled workflow";

      // Prepare workflow data for API
      const workflowData = {
        name: finalWorkflowName,
        description: workflowDescription,
        graph: {
          nodes: graph.nodes,
          edges: graph.edges,
          viewport: graph.viewport || { x: 0, y: 0, zoom: 1 },
        },
        metadata: {
          version: "1.0.0",
          maxSolPerTx: 1000000, // 0.001 SOL
          maxExecutionsPerHour: 10,
        },
      };

      if (editId) {
        // Update existing workflow
        await updateWorkflow.mutateAsync({ id: editId, data: workflowData });
      } else {
        // Create new workflow
        await createWorkflow.mutateAsync(workflowData);
      }

      router.push("/workflows");
    } catch (error) {
      console.error("Failed to save workflow:", error);
      setErrors(["Failed to save workflow. Please try again."]);
      setShowErrors(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching workflow
  if (editId && isLoadingWorkflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
          <p className="text-sm text-neutral-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Clean Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Left Section */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => router.push("/workflows")}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Back to workflows"
              >
                <svg
                  className="w-5 h-5 text-neutral-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0 max-w-3xl">
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="flex-1 px-3 py-2 text-base font-medium text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-neutral-400"
                  placeholder="Untitled workflow"
                />

                <input
                  type="text"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-neutral-400"
                  placeholder="Description (optional)"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/workflows")}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editId ? "Update Workflow" : "Create Workflow"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Clean Error Display */}
      {showErrors && errors.length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="px-6 py-3 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900 mb-1">
                Please fix the following errors:
              </p>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                setErrors([]);
                setShowErrors(false);
              }}
              className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
              aria-label="Dismiss"
            >
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Workflow Builder */}
      <main className="flex-1 overflow-hidden">
        <WorkflowBuilderContent ref={builderRef} />
      </main>
    </div>
  );
}
