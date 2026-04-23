"use client";

import { useCallback, useEffect, useState } from "react";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { useWorkflows } from "@/lib/hooks/use-workflows";
import { createBalanceMonitorWorkflow } from "@/lib/api";

const DISMISSED_KEY = "sol-workflow:balance-monitor-dismissed";

export function AnnouncementBanner() {
  const { authenticated, walletAddress } = useWalletAuth();
  const { data, isLoading } = useWorkflows();
  const [dismissed, setDismissed] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  const hasBalanceMonitor = Boolean(
    data?.workflows?.some((w) =>
      w.graph?.nodes?.some(
        (n: any) => n.type === "trigger" && n.data?.triggerType === "balance_change"
      )
    )
  );

  const handleSetup = useCallback(async () => {
    if (!walletAddress || saving) return;
    setSaving(true);
    try {
      await createBalanceMonitorWorkflow(walletAddress);
    } finally {
      localStorage.setItem(DISMISSED_KEY, "true");
      setDismissed(true);
      setSaving(false);
    }
  }, [walletAddress, saving]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }, []);

  if (!authenticated || dismissed || isLoading || hasBalanceMonitor) return null;

  return (
    <div
      className="relative flex h-[20px] w-full cursor-pointer items-center justify-center gap-2 px-4 text-[11px] font-medium transition-opacity hover:opacity-80"
      style={{
        background: "var(--foreground)",
        color: "var(--background)",
      }}
      onClick={handleSetup}
    >
      <span className="size-1.5 rounded-full bg-green-400 shrink-0" />
      <span>
        {saving ? "Setting up…" : "Enable SOL balance monitoring for your wallet — click to activate"}
      </span>
      <button
        onClick={handleDismiss}
        className="absolute right-3 flex items-center justify-center opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
