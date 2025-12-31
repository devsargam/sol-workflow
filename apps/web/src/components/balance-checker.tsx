"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface BalanceData {
  address: string;
  lamports: number;
  sol: number;
  formatted: string;
}

async function fetchBalance(address: string): Promise<BalanceData> {
  const res = await fetch(`http://localhost:3001/solana/balance/${address}`);
  if (!res.ok) throw new Error("Failed to fetch balance");
  return res.json();
}

export function BalanceChecker({ address }: { address: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["balance", address],
    queryFn: () => fetchBalance(address),
    enabled: !!address && address.length >= 32,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (!address) {
    return null;
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-sm font-medium text-neutral-700">Live Balance</h3>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
          disabled={isLoading}
        >
          <svg
            className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isLoading ? "Updating..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {(error as Error).message}
          </p>
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight">{data.formatted}</span>
              <span className="text-lg text-neutral-500 font-medium">SOL</span>
            </div>
            <p className="text-xs text-neutral-500 font-mono">
              {data.lamports.toLocaleString()} lamports
            </p>
          </div>
          <div className="pt-3 border-t border-neutral-200">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Wallet Address</p>
            <p className="text-xs font-mono text-neutral-600 truncate">
              {data.address}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function BalanceCheckerInput() {
  const [address, setAddress] = useState("");
  const [submittedAddress, setSubmittedAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedAddress(address);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Solana address to check balance"
          className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          pattern="[1-9A-HJ-NP-Za-km-z]{32,44}"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium text-sm"
        >
          Check
        </button>
      </form>

      {submittedAddress && <BalanceChecker address={submittedAddress} />}
    </div>
  );
}
