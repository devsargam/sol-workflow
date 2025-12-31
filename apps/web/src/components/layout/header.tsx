"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Sol Workflow</span>
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
      </div>
    </header>
  );
}
