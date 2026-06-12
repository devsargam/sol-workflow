"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  Bot,
  CalendarDays,
  ChevronRight,
  Clock3,
  Crosshair,
  Lock,
  Mail,
  Percent,
  Repeat,
  ScanSearch,
  Send,
  Settings2,
  ShieldAlert,
  TrendingUp,
  Wallet,
  Waves,
} from "lucide-react";

import { cn } from "@/lib/utils";

type AgentStep = {
  accent: "green" | "blue" | "red";
  icon: ComponentType<{ className?: string }>;
  label: string;
  tag: string;
};

type ConfigField = {
  label: string;
  value: string;
  meta?: string;
  locked?: boolean;
};

type FeaturedAgent = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  status: "Live Template" | "Draft Template";
  version: string;
  steps: AgentStep[];
  config: ConfigField[];
};

const defaultSteps: AgentStep[] = [
  {
    accent: "green",
    icon: CalendarDays,
    label: "Scheduled",
    tag: "Trigger",
  },
  {
    accent: "blue",
    icon: Wallet,
    label: "Wallet",
    tag: "Read",
  },
  {
    accent: "blue",
    icon: Bot,
    label: "AI Agent",
    tag: "AI",
  },
  {
    accent: "red",
    icon: Mail,
    label: "Email Report",
    tag: "Alert",
  },
];

const featuredAgents: FeaturedAgent[] = [
  {
    id: "vault-rebalancing",
    name: "Vault Rebalancing",
    subtitle: "Uniswap v3 Portfolio Mgr",
    description:
      "Watches portfolio drift, compares target weights, and prepares rebalance recommendations for review.",
    icon: Repeat,
    status: "Draft Template",
    version: "0.9.0",
    steps: [
      { accent: "green", icon: TrendingUp, label: "Position Drift", tag: "Watch" },
      { accent: "blue", icon: Wallet, label: "Vault Data", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Plan" },
      { accent: "red", icon: Mail, label: "Review Memo", tag: "Alert" },
    ],
    config: [
      { label: "Vault Address", value: "0x98e...7A21", locked: true },
      { label: "Pool", value: "ETH / USDC", meta: "Uniswap v3" },
      { label: "Threshold", value: "3.5%", meta: "Max drift" },
      { label: "Reviewer", value: "ops@example.com", locked: true },
    ],
  },
  {
    id: "whale-watcher",
    name: "Whale Watcher",
    subtitle: "Large Transfer Alerts",
    description:
      "Monitors high-value transfers and summarizes counterparty context before sending urgent alerts.",
    icon: Waves,
    status: "Live Template",
    version: "1.1.0",
    steps: [
      { accent: "green", icon: Crosshair, label: "Transfer Event", tag: "Trigger" },
      { accent: "blue", icon: Wallet, label: "Wallet", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Score" },
      { accent: "red", icon: Mail, label: "Whale Alert", tag: "Alert" },
    ],
    config: [
      { label: "Minimum Transfer", value: "$250,000", meta: "USD" },
      { label: "Chain", value: "Ethereum", meta: "Network" },
      { label: "Watchlist", value: "CEX, Funds, Smart Money" },
      { label: "Alert Channel", value: "alerts@example.com", locked: true },
    ],
  },
  {
    id: "nightly-wallet-report",
    name: "Nightly Wallet Report",
    subtitle: "Multi-Wallet AI Digest",
    description:
      "Runs every night across all your wallets. AI reads balances, analyzes daily changes, and emails you a clean portfolio summary before you wake up.",
    icon: Clock3,
    status: "Live Template",
    version: "1.0.0",
    steps: defaultSteps,
    config: [
      { label: "Wallet Addresses", value: "0xA1b...3D4f, +2 more", locked: true },
      { label: "Chain", value: "Ethereum", meta: "Network" },
      { label: "Report Schedule", value: "Daily · 8:00 PM", meta: "UTC" },
      { label: "Email Recipient", value: "user@example.com", locked: true },
    ],
  },
  {
    id: "dca-automation",
    name: "DCA Automation",
    subtitle: "Scheduled Token Purchases",
    description:
      "Places recurring buys on a fixed cadence with wallet balance checks and execution summaries.",
    icon: Repeat,
    status: "Live Template",
    version: "1.2.0",
    steps: [
      { accent: "green", icon: CalendarDays, label: "Scheduled", tag: "Trigger" },
      { accent: "blue", icon: Wallet, label: "Balance Check", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Guardrail", tag: "Check" },
      { accent: "red", icon: Send, label: "Buy Order", tag: "Action" },
    ],
    config: [
      { label: "Token Pair", value: "SOL / USDC" },
      { label: "Frequency", value: "Weekly", meta: "Monday" },
      { label: "Order Size", value: "$100", meta: "USDC" },
      { label: "Wallet", value: "0xA1b...3D4f", locked: true },
    ],
  },
  {
    id: "ltv-monitoring",
    name: "LTV Monitoring",
    subtitle: "Liquidation Protection",
    description:
      "Tracks borrow positions, evaluates liquidation risk, and sends alerts before thresholds are crossed.",
    icon: ShieldAlert,
    status: "Live Template",
    version: "1.0.4",
    steps: [
      { accent: "green", icon: Crosshair, label: "LTV Change", tag: "Watch" },
      { accent: "blue", icon: Wallet, label: "Loan Position", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Risk" },
      { accent: "red", icon: Mail, label: "Warning", tag: "Alert" },
    ],
    config: [
      { label: "Protocol", value: "Aave", meta: "Ethereum" },
      { label: "Risk Level", value: "72%", meta: "Warning" },
      { label: "Wallet", value: "0xA1b...3D4f", locked: true },
      { label: "Email Recipient", value: "risk@example.com", locked: true },
    ],
  },
  {
    id: "rug-pull-detection",
    name: "Rug Pull Detection",
    subtitle: "Token Safety Scanner",
    description:
      "Scans token liquidity, ownership, and suspicious market activity before escalating safety warnings.",
    icon: ScanSearch,
    status: "Draft Template",
    version: "0.8.0",
    steps: [
      { accent: "green", icon: ScanSearch, label: "Token Scan", tag: "Trigger" },
      { accent: "blue", icon: Wallet, label: "Liquidity", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Score" },
      { accent: "red", icon: Mail, label: "Safety Alert", tag: "Alert" },
    ],
    config: [
      { label: "Token", value: "New listings", meta: "Watchlist" },
      { label: "Liquidity Floor", value: "$50,000", meta: "Minimum" },
      { label: "Risk Score", value: "High only", meta: "Filter" },
      { label: "Alert Channel", value: "security@example.com", locked: true },
    ],
  },
  {
    id: "smart-limit-orders",
    name: "Smart Limit Orders",
    subtitle: "Auto Take Profit",
    description:
      "Evaluates target prices, route quality, and wallet constraints before preparing limit-order actions.",
    icon: TrendingUp,
    status: "Live Template",
    version: "1.3.1",
    steps: [
      { accent: "green", icon: TrendingUp, label: "Price Target", tag: "Trigger" },
      { accent: "blue", icon: Wallet, label: "Wallet", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Route" },
      { accent: "red", icon: Send, label: "Limit Order", tag: "Action" },
    ],
    config: [
      { label: "Asset", value: "SOL", meta: "Token" },
      { label: "Target", value: "$180.00", meta: "Take profit" },
      { label: "Order Size", value: "25%", meta: "Position" },
      { label: "Wallet", value: "0xA1b...3D4f", locked: true },
    ],
  },
  {
    id: "yield-scout",
    name: "Yield Scout",
    subtitle: "Daily APR Finder",
    description:
      "Compares yield opportunities daily and sends a ranked summary with risk notes.",
    icon: Percent,
    status: "Live Template",
    version: "1.0.2",
    steps: [
      { accent: "green", icon: CalendarDays, label: "Scheduled", tag: "Trigger" },
      { accent: "blue", icon: Percent, label: "Yield Data", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Rank" },
      { accent: "red", icon: Mail, label: "Scout Report", tag: "Alert" },
    ],
    config: [
      { label: "Chains", value: "Ethereum, Base", meta: "Networks" },
      { label: "Minimum APR", value: "6.0%", meta: "Filter" },
      { label: "Risk Level", value: "Moderate", meta: "Max" },
      { label: "Email Recipient", value: "yield@example.com", locked: true },
    ],
  },
  {
    id: "transaction-security-scanner",
    name: "Transaction Security Scanner",
    subtitle: "Pre-Trade Safety Check",
    description:
      "Reviews proposed transactions for contract, wallet, and route risk before execution.",
    icon: ShieldAlert,
    status: "Live Template",
    version: "1.4.0",
    steps: [
      { accent: "green", icon: ShieldAlert, label: "Transaction", tag: "Trigger" },
      { accent: "blue", icon: Wallet, label: "Contract", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Agent", tag: "Scan" },
      { accent: "red", icon: Mail, label: "Security Note", tag: "Alert" },
    ],
    config: [
      { label: "Wallet", value: "0xA1b...3D4f", locked: true },
      { label: "Risk Checks", value: "Contract, Route, Allowance" },
      { label: "Block Level", value: "High risk", meta: "Threshold" },
      { label: "Recipient", value: "security@example.com", locked: true },
    ],
  },
  {
    id: "scheduled-token-transfers",
    name: "Scheduled Token Transfers",
    subtitle: "Crypto Payroll & Recurring Payments",
    description:
      "Schedules recurring token transfers with recipient checks and completion receipts.",
    icon: Send,
    status: "Live Template",
    version: "1.0.1",
    steps: [
      { accent: "green", icon: CalendarDays, label: "Scheduled", tag: "Trigger" },
      { accent: "blue", icon: Wallet, label: "Wallet", tag: "Read" },
      { accent: "blue", icon: Bot, label: "AI Guardrail", tag: "Check" },
      { accent: "red", icon: Send, label: "Transfer", tag: "Action" },
    ],
    config: [
      { label: "Recipients", value: "12 wallets", locked: true },
      { label: "Token", value: "USDC", meta: "Asset" },
      { label: "Schedule", value: "Monthly · 9:00 AM", meta: "UTC" },
      { label: "Sender", value: "0xA1b...3D4f", locked: true },
    ],
  },
];

const accentStyles = {
  green: {
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    tag: "bg-emerald-50 text-emerald-700",
  },
  blue: {
    iconWrap: "bg-blue-50 text-blue-600 ring-blue-100",
    tag: "bg-blue-50 text-blue-700",
  },
  red: {
    iconWrap: "bg-red-50 text-red-500 ring-red-100",
    tag: "bg-red-50 text-red-600",
  },
} satisfies Record<AgentStep["accent"], { iconWrap: string; tag: string }>;

export function AgentTemplatePreview() {
  const [selectedAgentId, setSelectedAgentId] = useState("nightly-wallet-report");
  const selectedAgent = useMemo(
    () =>
      featuredAgents.find((agent) => agent.id === selectedAgentId) ??
      featuredAgents[2]!,
    [selectedAgentId]
  );

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <TopBar />
      <div className="grid min-h-[calc(100svh-2.5rem)] lg:h-[calc(100svh-2.5rem)] lg:grid-cols-[346px_minmax(560px,1fr)_450px] lg:overflow-hidden">
        <AgentRail
          agents={featuredAgents}
          selectedAgentId={selectedAgent.id}
          onSelect={setSelectedAgentId}
        />
        <WorkflowCanvas agent={selectedAgent} />
        <AgentConfigPanel agent={selectedAgent} />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex h-10 items-center justify-between border-b border-neutral-100 bg-white px-4 lg:px-6">
      <Link aria-label="Dolphinflow home" className="flex items-center gap-2" href="/">
        <span className="flex size-5 items-center justify-center rounded-full bg-neutral-950 text-white">
          <Waves className="size-3" />
        </span>
      </Link>
      <button className="h-8 rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800">
        Use template
      </button>
    </header>
  );
}

function AgentRail({
  agents,
  selectedAgentId,
  onSelect,
}: {
  agents: FeaturedAgent[];
  selectedAgentId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="border-r border-neutral-100 bg-white px-1 py-6 lg:py-10">
      <h2 className="px-5 text-sm font-bold uppercase tracking-[0.08em] text-neutral-400 lg:px-6">
        Featured Agents
      </h2>
      <div className="mt-8 flex gap-2 overflow-x-auto px-3 pb-3 lg:block lg:space-y-5 lg:overflow-visible lg:px-1 lg:pb-0">
        {agents.map((agent) => {
          const selected = agent.id === selectedAgentId;

          return (
            <button
              className={cn(
                "flex w-[280px] shrink-0 items-center justify-between rounded-lg px-6 py-4 text-left transition lg:w-full",
                selected
                  ? "border border-neutral-200 bg-white text-neutral-950 shadow-[0_12px_28px_rgba(15,15,15,0.08)]"
                  : "border border-transparent text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700"
              )}
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              type="button"
            >
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-lg font-semibold leading-tight",
                    selected ? "text-neutral-950" : "text-neutral-400"
                  )}
                >
                  {agent.name}
                </span>
                <span
                  className={cn(
                    "mt-1 block truncate text-base leading-tight",
                    selected ? "text-neutral-600" : "text-neutral-300"
                  )}
                >
                  {agent.subtitle}
                </span>
              </span>
              {selected ? <ChevronRight className="size-5 shrink-0 text-neutral-400" /> : null}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function WorkflowCanvas({ agent }: { agent: FeaturedAgent }) {
  return (
    <section
      className="relative min-h-[720px] overflow-hidden bg-[#fbfbfb]"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(212, 212, 212, 0.58) 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    >
      <div className="absolute left-6 top-6 lg:left-9 lg:top-9">
        <div className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-5 py-3 text-base font-semibold text-neutral-600 shadow-[0_12px_26px_rgba(15,15,15,0.08)]">
          <span className="size-3 rounded-full bg-emerald-400" />
          Interactive Preview
        </div>
      </div>

      <div className="flex min-h-[720px] items-center justify-center px-6 py-24 lg:h-full lg:min-h-0 lg:translate-y-12">
        <div className="flex w-full max-w-[304px] flex-col items-center">
          {agent.steps.map((step, index) => (
            <div className="flex w-full flex-col items-center" key={`${agent.id}-${step.label}`}>
              <WorkflowNode step={step} showTopHandle={index === 0} />
              {index < agent.steps.length - 1 ? <Connector /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowNode({
  step,
  showTopHandle,
}: {
  step: AgentStep;
  showTopHandle?: boolean;
}) {
  const Icon = step.icon;
  const styles = accentStyles[step.accent];

  return (
    <div className="relative w-full rounded-lg border border-neutral-100 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(15,15,15,0.05)]">
      {showTopHandle ? (
        <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-300" />
      ) : null}
      <span className="absolute bottom-0 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-neutral-300" />
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[4px] ring-1",
            styles.iconWrap
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-base font-bold text-neutral-900">
          {step.label}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-[4px] px-2 py-1 text-sm font-bold leading-none",
            styles.tag
          )}
        >
          {step.tag}
        </span>
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div className="relative h-28 w-px bg-neutral-400/80">
      <span className="absolute bottom-2 left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-neutral-500" />
    </div>
  );
}

function AgentConfigPanel({ agent }: { agent: FeaturedAgent }) {
  return (
    <aside className="flex flex-col border-l border-neutral-100 bg-white">
      <div className="flex-1 px-6 py-8 lg:px-8 lg:py-9">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "rounded-[5px] border px-3 py-2 text-sm font-bold uppercase tracking-[0.04em]",
              agent.status === "Live Template"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-neutral-200 bg-neutral-50 text-neutral-500"
            )}
          >
            {agent.status}
          </span>
          <span className="rounded-[5px] bg-neutral-100 px-3 py-2 text-sm font-bold uppercase tracking-[0.04em] text-neutral-500">
            V{agent.version}
          </span>
        </div>

        <h1 className="mt-7 text-4xl font-extrabold leading-none tracking-normal text-neutral-950">
          {agent.name}
        </h1>
        <p className="mt-5 max-w-[360px] text-xl font-medium leading-8 text-neutral-500">
          {agent.description}
        </p>

        <section className="mt-12">
          <div className="flex items-center gap-3">
            <Settings2 className="size-5 text-neutral-400" />
            <h2 className="text-base font-extrabold uppercase tracking-[0.12em] text-neutral-900">
              Configuration
            </h2>
          </div>

          <div className="mt-7 space-y-6">
            {agent.config.map((field) => (
              <ConfigInput field={field} key={`${agent.id}-${field.label}`} />
            ))}
          </div>
        </section>
      </div>

      <div className="h-14 border-t border-neutral-100" />
    </aside>
  );
}

function ConfigInput({ field }: { field: ConfigField }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-neutral-500">{field.label}</span>
      <span className="mt-3 flex h-14 items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <span className="min-w-0 flex-1 truncate font-mono text-lg font-semibold tracking-normal text-neutral-700">
          {field.value}
        </span>
        {field.meta ? (
          <span className="shrink-0 text-base font-semibold text-neutral-400">{field.meta}</span>
        ) : null}
        {field.locked ? <Lock className="size-5 shrink-0 text-neutral-400" /> : null}
      </span>
    </label>
  );
}
