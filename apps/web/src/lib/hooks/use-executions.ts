"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchExecutions, fetchExecution } from "@/lib/api";
import { INTERVALS } from "utils";

export function useExecutions(workflowId?: string) {
  return useQuery({
    queryKey: workflowId ? ["executions", workflowId] : ["executions"],
    queryFn: () => fetchExecutions(workflowId),
    refetchInterval: INTERVALS.REFETCH_EXECUTIONS,
  });
}

export function useExecution(id: string) {
  return useQuery({
    queryKey: ["executions", id],
    queryFn: () => fetchExecution(id),
    enabled: !!id,
  });
}
