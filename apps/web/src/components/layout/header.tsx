"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy, useWallets } from "@privy-io/react-auth";

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
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  console.log(authenticated);
  console.log(user);
  console.log(wallets);
  console.log(ready);
  console.log(pathname);
  console.log(authenticated);
  console.log(user);
  console.log(wallets);
  console.log(ready);
  console.log(pathname);
  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
  };

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
          {ready && (
            <>
              {authenticated ? (
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
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 transition-colors text-sm font-medium"
                >
                  Login
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
