"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { XIcon } from "@phosphor-icons/react";

const DISMISSED_KEY = "sol-workflow:announcement-dismissed";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div className="bg-black text-white border-b border-white/10">
      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <p className="pr-8 text-center text-[11px] font-medium tracking-[0.02em] text-white/90 sm:text-xs">
          <Link href="/workflows/builder" className="text-white underline underline-offset-2">
            Click here to set up your first automation.
          </Link>
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-white/50 transition-colors hover:text-white sm:right-6"
          aria-label="Dismiss announcement"
        >
          <XIcon size={14} />
        </button>
      </div>
    </div>
  );
}
