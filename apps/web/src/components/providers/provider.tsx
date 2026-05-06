"use client";

import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { useTheme } from "next-themes";
import { QueryProvider } from "./query-provider";
import { WalletAuthProvider } from "./wallet-auth-provider";
import type { WalletSession } from "@/lib/auth-session";

export function Provider({
  children,
  initialWalletSession = null,
}: {
  children: React.ReactNode;
  initialWalletSession?: WalletSession | null;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <UnifiedWalletProvider
      wallets={[]}
      localStorageKey="dolphinflow:wallet-kit"
      config={{
        autoConnect: true,
        env: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as
          | "devnet"
          | "testnet"
          | "mainnet-beta",
        metadata: {
          name: "dolphinflow",
          description: "Wallet-powered Solana workflow automation",
          url: typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
          iconUrls: ["https://solana.com/src/img/branding/solanaLogoMark.svg"],
        },
        theme: resolvedTheme === "dark" ? "dark" : "light",
      }}
    >
      <WalletAuthProvider initialSession={initialWalletSession}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </WalletAuthProvider>
    </UnifiedWalletProvider>
  );
}
