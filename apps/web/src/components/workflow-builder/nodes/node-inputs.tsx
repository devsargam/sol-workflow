"use client";

import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes, InputHTMLAttributes } from "react";

const inputBase =
  "w-full text-[12px] border border-[var(--node-border)] rounded-[5px] " +
  "px-2.5 py-1.5 bg-[var(--surface-3)] text-[var(--text-primary)] " +
  "placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 " +
  "focus:ring-[var(--brand)] focus:border-transparent transition-all";

export function NodeField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <span className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </span>
      {children}
    </div>
  );
}

export function NodeInput({
  mono,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      {...props}
      className={cn(inputBase, mono && "font-mono", className)}
    />
  );
}

export function NodeSelect({
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputBase, "cursor-pointer", className)}>
      {children}
    </select>
  );
}

export function NodeSeparator() {
  return <div className="border-t border-[var(--node-border)]" />;
}

export function ConfigRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className={cn("text-[11px] text-[var(--text-secondary)] truncate", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}
