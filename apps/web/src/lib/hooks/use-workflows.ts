"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import {
  fetchWorkflows,
  fetchWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  type CreateWorkflowData,
} from "@/lib/api";

export function useWorkflows() {
  const { authenticated, ready, walletAddress } = useWalletAuth();

  return useQuery({
    queryKey: ["workflows", walletAddress],
    queryFn: fetchWorkflows,
    enabled: ready && authenticated,
  });
}

export function useWorkflow(id: string) {
  const { authenticated, ready, walletAddress } = useWalletAuth();

  return useQuery({
    queryKey: ["workflows", walletAddress, id],
    queryFn: () => fetchWorkflow(id),
    enabled: ready && authenticated && !!id,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkflowData> }) =>
      updateWorkflow(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows", variables.id] });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useToggleWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleWorkflow,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflows", data.workflow.id] });
    },
  });
}
