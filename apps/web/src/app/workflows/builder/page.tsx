import { Suspense } from "react";
import WorkflowBuilderClientPage from "./client-page";

export default function WorkflowBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-neutral-600">
              <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
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
