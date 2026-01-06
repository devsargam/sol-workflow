"use client";

import { SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group relative">
          <SettingsIcon className="aspect-square h-8 duration-700" />
          <div className="w-36">
            <span className="text-xl w-36 font-dynapuff decoration-wavy underline absolute -top-0">
              SOL Workflow
            </span>
          </div>
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
      </div>
    </header>
  );
}
