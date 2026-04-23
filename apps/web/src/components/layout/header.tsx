"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: "rgba(23, 23, 23, 0.08)",
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="dolphinflow logo"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
            priority
          />
          <span
            className="text-xl font-semibold tracking-[-0.03em]"
            style={{ color: "var(--text-primary)" }}
          >
            dolphinflow
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 rounded-2xl border p-1 md:flex"
          style={{
            background: "rgba(23, 23, 23, 0.03)",
            borderColor: "rgba(23, 23, 23, 0.06)",
          }}
        >
          <Link
            href="/workflows"
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              background: pathname === "/workflows" ? "white" : "transparent",
              color: pathname === "/workflows" ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            Workflows
          </Link>
          <Link
            href="/executions"
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{
              background: pathname === "/executions" ? "white" : "transparent",
              color: pathname === "/executions" ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            Executions
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent" />
          {mounted ? <HeaderAuth /> : null}
        </div>
      </div>
    </header>
  );
}

function HeaderAuth() {
  const { ready, authenticated, login, logout, walletAddress } = useWalletAuth();

  if (!ready) {
    return null;
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          {walletAddress && (
            <span
              className="hidden rounded-md border px-3 py-1 font-mono text-xs sm:inline"
              style={{ borderColor: "rgba(23, 23, 23, 0.08)" }}
            >
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </span>
          )}
        </div>
        <button
          onClick={logout}
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="rounded-xl border px-4 py-2 text-sm font-medium"
      style={{
        background: "white",
        borderColor: "rgba(23, 23, 23, 0.08)",
        color: "var(--text-primary)",
      }}
    >
      Connect Wallet
    </button>
  );
}
