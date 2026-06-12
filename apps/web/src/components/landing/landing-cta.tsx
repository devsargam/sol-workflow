"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { useWalletAuth } from "@/components/providers/wallet-auth-provider";

export function useAuthGatedNavigation() {
  const router = useRouter();
  const { ready, authenticated, login } = useWalletAuth();
  const loginRequestedRef = useRef(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingHref) {
      return;
    }

    if (authenticated) {
      loginRequestedRef.current = false;
      setPendingHref(null);
      router.push(pendingHref);
      return;
    }

    if (ready && !loginRequestedRef.current) {
      loginRequestedRef.current = true;
      void login();
    }
  }, [authenticated, login, pendingHref, ready, router]);

  return useCallback(
    (href: string) => {
      if (authenticated) {
        router.push(href);
        return;
      }

      loginRequestedRef.current = false;
      setPendingHref(href);
    },
    [authenticated, router]
  );
}

type LandingCtaProps = {
  children: ReactNode;
  className?: string;
  href?: string;
};

export function LandingCta({ children, className, href = "/dashboard" }: LandingCtaProps) {
  const navigate = useAuthGatedNavigation();

  return (
    <button type="button" className={className} onClick={() => navigate(href)}>
      {children}
    </button>
  );
}
