"use client";

import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { useEffect, useState } from "react";
import { QueryProvider } from "./query-provider";
import { WalletAuthProvider } from "./wallet-auth-provider";

export function Provider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <QueryProvider>{children}</QueryProvider>;
  }

  return (
    <UnifiedWalletProvider
      wallets={[]}
      localStorageKey="sol-workflow:wallet-kit"
      config={{
        autoConnect: true,
        env: (process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet") as "devnet" | "testnet" | "mainnet-beta",
        metadata: {
          name: "SOL Workflow",
          description: "Wallet-powered Solana workflow automation",
          url: typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
          iconUrls: ["https://solana.com/src/img/branding/solanaLogoMark.svg"],
        },
        theme: "light",
      }}
    >
      <WalletAuthProvider>
        <QueryProvider>{children}</QueryProvider>
      </WalletAuthProvider>
    </UnifiedWalletProvider>
  );
}
