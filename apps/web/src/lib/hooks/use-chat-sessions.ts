"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { fetchChatSession, fetchChatSessions } from "@/lib/api";

export function useChatSessions() {
  const { authenticated, ready, walletAddress } = useWalletAuth();

  return useQuery({
    queryKey: ["chat-sessions", walletAddress],
    queryFn: fetchChatSessions,
    enabled: ready && authenticated,
  });
}

export function useChatSession(id: string | null) {
  const { authenticated, ready, walletAddress } = useWalletAuth();

  return useQuery({
    queryKey: ["chat-sessions", walletAddress, id],
    queryFn: () => fetchChatSession(id as string),
    enabled: ready && authenticated && !!id,
  });
}
