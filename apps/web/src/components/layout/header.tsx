"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 2"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "center" }}
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const hasValidAppId = Boolean(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID &&
      process.env.NEXT_PUBLIC_PRIVY_APP_ID !== "missing_privy_app_id"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b border-black bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
            <WorkflowIcon className="size-8" />
          </motion.div>
          <span className="text-xl font-dynapuff">SOL Workflow</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/workflows"
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              pathname === "/workflows"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Workflows
          </Link>
          <Link
            href="/executions"
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              pathname === "/executions"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
            }`}
          >
            Executions
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {mounted && hasValidAppId ? <HeaderAuth /> : null}
        </div>
      </div>
    </header>
  );
}

function HeaderAuth() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  if (!ready) {
    return null;
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          {user?.email?.address && (
            <span className="hidden sm:inline">{user.email.address}</span>
          )}
          {wallets.length > 0 && wallets[0] && (
            <span className="hidden sm:inline font-mono text-xs">
              {wallets[0].address.slice(0, 4)}...{wallets[0].address.slice(-4)}
            </span>
          )}
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 transition-colors text-sm font-medium"
    >
      Login
    </button>
  );
}
