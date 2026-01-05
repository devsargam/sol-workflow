"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryProvider } from "./query-provider";

export function Provider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables");
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#000000",
          logo: undefined,
        },
        embeddedWallets: {
          // createOnLogin:{
          //     solana:{
          //         accountSuffix: "sol-workflow",
          //     }
          // }
        },
      }}
    >
      <QueryProvider>{children}</QueryProvider>
    </PrivyProvider>
  );
}
