"use client";

import { WorkflowBuilderContent } from "@/components/workflow-builder/WorkflowBuilderWithSave";
import { useCreateWorkflow, useUpdateWorkflow, useWorkflow } from "@/lib/hooks/use-workflows";
import { validateWorkflowGraphForBuilder } from "@repo/types";
import { log } from "utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const WORKFLOW_NAMES = [
  "swift-sentinel",
  "chain-watcher",
  "sol-guardian",
  "nft-monitor",
  "token-relay",
  "program-scout",
  "vault-tracker",
  "epoch-signal",
  "stake-monitor",
  "block-observer",
  "wallet-guard",
  "ledger-watch",
  "dao-relay",
  "market-pulse",
  "price-radar",
  "defi-beacon",
  "mint-scanner",
  "balance-alert",
  "tx-monitor",
  "sol-patrol",
];

export default function WorkflowBuilderClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } = useWorkflow(editId || "");

  const builderRef = useRef<any>(null);
  const [workflowName, setWorkflowName] = useState(() =>
    editId
      ? ""
      : WORKFLOW_NAMES[Math.floor(Math.random() * WORKFLOW_NAMES.length)]!
  );
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);

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
          maxSolPerTx: 1000000,
          maxExecutionsPerHour: 10,
        },
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
      router.push("/dashboard/workflows");
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
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--canvas-bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--node-border)] border-t-[var(--brand)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading workflow…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <WorkflowBuilderContent
        ref={builderRef}
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        workflowDescription={workflowDescription}
        onDescriptionChange={setWorkflowDescription}
        onSave={handleSave}
        isSaving={isSaving}
        editId={editId}
        onBack={() => router.push("/dashboard/workflows")}
        errors={showErrors ? errors : []}
        onDismissErrors={() => {
          setErrors([]);
          setShowErrors(false);
        }}
      />
    </div>
  );
}
