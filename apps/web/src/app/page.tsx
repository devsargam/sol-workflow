"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { WorkflowChat, WorkflowChatFallback } from "@/components/chat/workflow-chat";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  const { ready, authenticated, authenticating, login, logout, walletAddress } = useWalletAuth();

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f8f6] text-[#171717] dark:bg-[#070707] dark:text-white">
      <HomeNav
        authenticated={authenticated}
        authenticating={authenticating}
        login={login}
        logout={logout}
        ready={ready}
        walletAddress={walletAddress}
      />
      <Suspense
        fallback={
          <WorkflowChatFallback className="min-h-[calc(100svh-3.5rem)] rounded-none" />
        }
      >
        <WorkflowChat
          chatPath="/"
          className="min-h-[calc(100svh-3.5rem)] rounded-none"
          emptyTitle="What workflow should we build?"
          requireAuthBeforeSend
        />
      </Suspense>
    </div>
  );
}

type HomeNavProps = {
  authenticated: boolean;
  authenticating: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  ready: boolean;
  walletAddress: string | null;
};

function HomeNav({
  authenticated,
  authenticating,
  login,
  logout,
  ready,
  walletAddress,
}: HomeNavProps) {
  return (
    <nav className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-black/10 bg-white/82 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#070707]/88 sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-2 text-black dark:text-white">
        <Image
          alt="Dolphinflow logo"
          className="h-9 w-9 rounded-xl object-cover"
          height={34}
          priority
          src="/logo.jpg"
          width={34}
        />
        <span className="hidden text-lg font-medium tracking-normal sm:inline-block">
          dolphinflow
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        {ready && !authenticated ? (
          <Link
            className="hidden text-sm/6 text-gray-900 underline underline-offset-2 dark:text-white sm:inline"
            href="/usecases"
          >
            Use cases
          </Link>
        ) : null}
        <Link
          className="hidden text-sm/6 text-gray-900 underline underline-offset-2 dark:text-white sm:inline"
          href="/docs"
        >
          Docs
        </Link>
        {authenticated ? (
          <Link
            className="hidden text-sm/6 text-gray-900 underline underline-offset-2 dark:text-white md:inline"
            href="/dashboard"
          >
            Dashboard
          </Link>
        ) : null}
        <ThemeToggle />

        {authenticated ? (
          <div className="flex items-center gap-2">
            {walletAddress ? (
              <span className="hidden rounded-full border border-black/10 bg-white px-3 py-2 font-mono text-xs text-black/70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72 sm:inline">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            ) : null}
            <Button
              className="h-9 rounded-full px-4"
              onClick={() => void logout()}
              size="sm"
              variant="outline"
            >
              Log out
            </Button>
          </div>
        ) : (
          <Button
            className="h-9 rounded-full px-4"
            disabled={!ready || authenticating}
            onClick={() => void login()}
            size="sm"
          >
            {authenticating ? "Signing..." : "Connect wallet"}
          </Button>
        )}
      </div>
    </nav>
  );
}
