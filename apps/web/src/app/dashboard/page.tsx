"use client";

import { Suspense } from "react";

import { WorkflowChat, WorkflowChatFallback } from "@/components/chat/workflow-chat";

export default function DashboardPage() {
  return (
    <Suspense fallback={<WorkflowChatFallback />}>
      <WorkflowChat chatPath="/dashboard" />
    </Suspense>
  );
}
