"use client";
import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { QueryProvider } from "./query-provider";

export function Provider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";
  // @todo-fix it
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasValidAppId = Boolean(appId && appId !== "missing_privy_app_id");
  if (!mounted || !hasValidAppId) {
    // Avoid failing static prerender/build and avoid initializing Privy on the server.
    // Auth features will be unavailable until a valid app id is provided at runtime.
    return <QueryProvider>{children}</QueryProvider>;
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
