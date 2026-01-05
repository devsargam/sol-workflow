"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error("NEXT_PUBLIC_PRIVY_APP_ID is not set in environment variables");
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#000000",
          logo: undefined,
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
