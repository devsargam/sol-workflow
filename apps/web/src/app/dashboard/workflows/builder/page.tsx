import { Suspense } from "react";
import WorkflowBuilderClientPage from "../../../workflows/builder/client-page";

export default function DashboardWorkflowBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-50 dark:bg-[#070707]">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-neutral-600 dark:text-white/70">
              <div className="size-5 animate-spin rounded-full border-2 border-neutral-300 border-t-black dark:border-white/20 dark:border-t-white" />
              <span>Loading builder...</span>
            </div>
          </div>
        </div>
      }
    >
      <WorkflowBuilderClientPage />
    </Suspense>
  );
}
