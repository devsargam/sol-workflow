"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchExecutions, fetchExecution } from "@/lib/api";

export function useExecutions(workflowId?: string) {
  return useQuery({
    queryKey: workflowId ? ["executions", workflowId] : ["executions"],
    queryFn: () => fetchExecutions(workflowId),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: ["executions", id],
    queryFn: () => fetchExecution(id),
    enabled: !!id,
  });
}
