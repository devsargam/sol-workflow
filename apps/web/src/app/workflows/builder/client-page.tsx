"use client";

import { WorkflowBuilderContent } from "@/components/workflow-builder/WorkflowBuilderWithSave";
import { useCreateWorkflow, useUpdateWorkflow, useWorkflow } from "@/lib/hooks/use-workflows";
import { validateWorkflowGraphForBuilder } from "@repo/types";
import { log } from "utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/header";

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
  const [showKalshiConfig, setShowKalshiConfig] = useState(false);
  const [kalshiApiKey, setKalshiApiKey] = useState("");
  const [kalshiPrivateKey, setKalshiPrivateKey] = useState("");
  const [kalshiDemoMode, setKalshiDemoMode] = useState(true);

  useEffect(() => {
    if (existingWorkflow?.workflow) {
      const workflow = existingWorkflow.workflow;
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || "");

      if (builderRef.current && workflow.graph) {
        builderRef.current.loadWorkflow(workflow.graph);
      }
    }
  }, [existingWorkflow]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrors([]);
    setShowErrors(false);

    try {
      const graph = builderRef.current?.getWorkflowData();

      if (!graph) {
        setErrors(["Unable to extract workflow graph"]);
        setShowErrors(true);
        setIsSaving(false);
        return;
      }

      const validationErrors = validateWorkflowGraphForBuilder(graph);
      if (validationErrors.length > 0) {
        log.warn("Workflow validation failed", {
          service: "web",
          workflowId: editId || "new",
          errors: validationErrors,
        });
        setErrors(validationErrors);
        setShowErrors(true);
        setIsSaving(false);
        return;
      }

      const finalWorkflowName = workflowName.trim() || "Untitled workflow";

      // Check for Kalshi actions and validate credentials
      const hasKalshiAction = graph.nodes.some(
        (node: any) =>
          node.data?.actionType === "kalshi_place_order" || node.data?.type === "kalshi_place_order"
      );

      const hasKalshiTrigger = graph.nodes.some(
        (node: any) =>
          node.type === "trigger" &&
          (node.data?.triggerType === "market_price_check" ||
            node.data?.type === "market_price_check")
      );

      const needsKalshiCredentials = hasKalshiAction || hasKalshiTrigger;

      if (hasKalshiAction) {
        // Validate Kalshi action configurations
        const kalshiNodes = graph.nodes.filter(
          (node: any) =>
            node.data?.actionType === "kalshi_place_order" ||
            node.data?.type === "kalshi_place_order"
        );

        for (const node of kalshiNodes) {
          const config = node.data?.config || {};
          const ticker = config.ticker || config.marketId;
          if (!ticker) {
            setErrors([
              `Kalshi action node "${node.data?.label || node.id}" is missing market ticker`,
            ]);
            setShowErrors(true);
            setIsSaving(false);
            return;
          }
          if (!config.side || !["yes", "no"].includes(config.side)) {
            setErrors([
              `Kalshi action node "${node.data?.label || node.id}" must specify side (yes/no)`,
            ]);
            setShowErrors(true);
            setIsSaving(false);
            return;
          }
          if (!config.count || config.count < 1) {
            setErrors([
              `Kalshi action node "${node.data?.label || node.id}" must specify count (≥1)`,
            ]);
            setShowErrors(true);
            setIsSaving(false);
            return;
          }
          if (!config.price || config.price < 1 || config.price > 99) {
            setErrors([
              `Kalshi action node "${node.data?.label || node.id}" must specify price (1-99 cents)`,
            ]);
            setShowErrors(true);
            setIsSaving(false);
            return;
          }
        }

        // Validate credentials
        if (!kalshiApiKey || !kalshiPrivateKey) {
          setErrors([
            "Kalshi credentials are required for workflows with Kalshi actions. Please configure them using the Kalshi button.",
          ]);
          setShowErrors(true);
          setShowKalshiConfig(true);
          setIsSaving(false);
          return;
        }
      }

      if (hasKalshiTrigger) {
        if (!kalshiApiKey || !kalshiPrivateKey) {
          setErrors([
            "Kalshi credentials are required for workflows with market price check triggers. Please configure them using the Kalshi button.",
          ]);
          setShowErrors(true);
          setShowKalshiConfig(true);
          setIsSaving(false);
          return;
        }
      }

      const metadata: any = {
        version: "1.0.0",
        maxSolPerTx: 1000000,
        maxExecutionsPerHour: 10,
      };

      if (needsKalshiCredentials && kalshiApiKey && kalshiPrivateKey) {
        metadata.kalshiCredentials = {
          apiKey: kalshiApiKey,
          privateKeyPem: kalshiPrivateKey,
          demoMode: kalshiDemoMode,
        };
        metadata.kalshiLimits = {
          maxCostPerOrder: 10.0,
          maxDailyVolume: 50.0,
        };
      }

      const workflowData = {
        name: finalWorkflowName,
        description: workflowDescription,
        graph: {
          nodes: graph.nodes,
          edges: graph.edges,
          viewport: graph.viewport || { x: 0, y: 0, zoom: 1 },
        },
        metadata,
      };

      if (editId) {
        await updateWorkflow.mutateAsync({ id: editId, data: workflowData });
      } else {
        await createWorkflow.mutateAsync(workflowData);
      }

      log.info("Workflow saved successfully", {
        service: "web",
        workflowId: editId || "new",
        workflowName: finalWorkflowName,
      });
      router.push("/workflows");
    } catch (error) {
      log.error("Failed to save workflow", error as Error, {
        service: "web",
        workflowId: editId || "new",
        workflowName: workflowName,
      });
      setErrors(["Failed to save workflow. Please try again."]);
      setShowErrors(true);
    } finally {
      setIsSaving(false);
    }
  };

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
      <Header />
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKalshiConfig(!showKalshiConfig)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-2"
                title="Configure Kalshi credentials"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Kalshi
              </button>
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

      {showKalshiConfig && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
                  <h3 className="text-sm font-semibold text-blue-900">Kalshi API Configuration</h3>
                </div>
                <p className="text-xs text-blue-700">
                  Required if your workflow includes Kalshi actions. Credentials are stored securely
                  in workflow metadata.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">API Key</label>
                    <input
                      type="text"
                      value={kalshiApiKey}
                      onChange={(e) => setKalshiApiKey(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Your Kalshi API key"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-900 mb-1">
                      Private Key (PEM)
                    </label>
                    <textarea
                      value={kalshiPrivateKey}
                      onChange={(e) => setKalshiPrivateKey(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono text-xs"
                      placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="kalshi-demo"
                    checked={kalshiDemoMode}
                    onChange={(e) => setKalshiDemoMode(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="kalshi-demo" className="text-xs text-blue-900">
                    Demo Mode (Safe - No real money)
                  </label>
                </div>
              </div>
              <button
                onClick={() => setShowKalshiConfig(false)}
                className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
                aria-label="Close"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
