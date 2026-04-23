"use client";

import Link from "next/link";
import { CirclesFourIcon } from "@phosphor-icons/react";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface DarkNavProps {
  links?: { label: string; href: string }[];
  sticky?: boolean;
}

export function DarkNav({ links = [], sticky = false }: DarkNavProps) {
  const { ready, authenticated, login, logout, walletAddress } = useWalletAuth();

  return (
    <nav
      className={
        sticky
          ? "sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md"
          : "relative z-10"
      }
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8 sm:py-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <CirclesFourIcon className="size-[18px]" weight="regular" />
          <span className="text-sm font-semibold tracking-tight">dolphinflow</span>
        </Link>

        {/* Optional centre links */}
        {links.length > 0 && (
          <div className="hidden items-center gap-8 md:flex">
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {/*
          Zero-shift auth: unauthenticated div stays in flow (sets container width).
          Both states start opacity-0 so there is no SSR flash.
        */}
        <div className="relative flex items-center gap-2">
          <ThemeToggle className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />

          <div
            className="flex items-center gap-3 sm:gap-5 transition-opacity duration-300"
            style={{
              opacity: ready && !authenticated ? 1 : 0,
              pointerEvents: ready && !authenticated ? "auto" : "none",
            }}
            aria-hidden={!(ready && !authenticated)}
          >
            <button
              onClick={login}
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Log in
            </button>
            <button
              onClick={login}
              className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90 sm:px-4 sm:text-sm"
            >
              <span className="sm:hidden">Connect</span>
              <span className="hidden sm:inline">Connect wallet</span>
            </button>
          </div>

          <div
            className="absolute right-0 flex items-center gap-3 transition-opacity duration-300"
            style={{
              opacity: ready && authenticated ? 1 : 0,
              pointerEvents: ready && authenticated ? "auto" : "none",
            }}
            aria-hidden={!(ready && authenticated)}
          >
            {walletAddress && (
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            )}
            <button
              onClick={logout}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
