"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkflowBuilderContent } from "@/components/workflow-builder/WorkflowBuilderWithSave";
import { useCreateWorkflow, useUpdateWorkflow, useWorkflow } from "@/lib/hooks/use-workflows";

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

  // Load existing workflow data when editing
  useEffect(() => {
    if (existingWorkflow?.workflow) {
      const workflow = existingWorkflow.workflow;
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || "");

      // Load the workflow into the visual builder
      if (builderRef.current) {
        builderRef.current.loadWorkflow({
          trigger: {
            type: workflow.triggerType,
            config: workflow.triggerConfig,
          },
          filter: {
            conditions: workflow.filterConditions || [],
          },
          action: {
            type: workflow.actionType,
            config: workflow.actionConfig,
          },
          notify: {
            type: workflow.notifyType,
            webhookUrl: workflow.notifyWebhookUrl,
            template: workflow.notifyTemplate,
          },
        });
      }
    }
  }, [existingWorkflow]);

  const validateWorkflowData = (data: any) => {
    const errors: string[] = [];

    // Validate trigger
    if (!data.trigger?.config?.address) {
      errors.push("Trigger: Wallet address is required");
    }

    // Validate action
    if (data.action?.type === "send_sol") {
      if (!data.action.config?.toAddress) {
        errors.push("Action: Recipient address is required");
      }
      if (!data.action.config?.amount) {
        errors.push("Action: Amount is required");
      }
    }

    // Validate notify
    if (data.notify?.type === "discord" && !data.notify.webhookUrl) {
      errors.push("Notify: Discord webhook URL is required");
    }

    return errors;
  };

  const handleSave = async () => {
    if (!workflowName.trim()) {
      setErrors(["Please enter a workflow name"]);
      return;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      // Get workflow data from React Flow
      const flowData = builderRef.current?.getWorkflowData();

      if (!flowData) {
        setErrors(["Unable to extract workflow data"]);
        setIsSaving(false);
        return;
      }

      // Validate the workflow data
      const validationErrors = validateWorkflowData(flowData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setIsSaving(false);
        return;
      }

      // Prepare workflow data for API
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        ...flowData,
        // Remove visual data before sending to API
        _visual: undefined,
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
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching workflow
  if (editId && isLoadingWorkflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-neutral-600">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
            <span>Loading workflow...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/workflows")}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-4">
              <div className="text-sm text-neutral-500">
                {editId ? "Editing" : "Creating"} workflow:
              </div>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Workflow name..."
              />

              <input
                type="text"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black w-64"
                placeholder="Description (optional)..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/workflows")}
              className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !workflowName.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isSaving ? "Saving..." : editId ? "Update Workflow" : "Create Workflow"}
            </button>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setErrors([])}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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