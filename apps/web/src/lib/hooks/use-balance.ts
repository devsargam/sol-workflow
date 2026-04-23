"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ENV_DEFAULTS, API } from "utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || ENV_DEFAULTS.NEXT_PUBLIC_API_URL;

interface BalanceData {
  sol: number;
  lamports: number;
  address: string;
  delta: number; // lamport change since last fetch (positive = received)
}

async function fetchBalance(address: string): Promise<BalanceData> {
  const res = await fetch(`${API_URL}${API.ROUTES.SOLANA}/balance/${address}`);
  if (!res.ok) throw new Error("Failed to fetch balance");
  const data = await res.json();
  return { sol: data.sol, lamports: data.lamports, address: data.address, delta: 0 };
}

export function useBalance(address: string | null | undefined, refetchIntervalMs = 4000) {
  const prevLamportsRef = useRef<number | null>(null);

  return useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      const data = await fetchBalance(address!);
      const delta = prevLamportsRef.current !== null ? data.lamports - prevLamportsRef.current : 0;
      prevLamportsRef.current = data.lamports;
      return { ...data, delta };
    },
    enabled: Boolean(address),
    refetchInterval: refetchIntervalMs,
    staleTime: 0,
  });
}
