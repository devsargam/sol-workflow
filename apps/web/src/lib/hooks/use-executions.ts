"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { fetchExecutions, fetchExecution } from "@/lib/api";
import { INTERVALS } from "utils";

export function useExecutions(workflowId?: string) {
  const { authenticated, ready, walletAddress } = useWalletAuth();

  return useQuery({
    queryKey: workflowId ? ["executions", walletAddress, workflowId] : ["executions", walletAddress],
    queryFn: () => fetchExecutions(workflowId),
    refetchInterval: INTERVALS.REFETCH_EXECUTIONS,
    enabled: ready && authenticated,
  });
}

export function useExecution(id: string) {
  const { authenticated, ready, walletAddress } = useWalletAuth();

  return useQuery({
    queryKey: ["executions", walletAddress, id],
    queryFn: () => fetchExecution(id),
    enabled: ready && authenticated && !!id,
  });
}
