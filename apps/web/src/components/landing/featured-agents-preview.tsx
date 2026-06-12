"use client";

import Link from "next/link";
import { useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Bot,
  Calendar,
  ChevronRight,
  Coins,
  Cpu,
  FileText,
  Gauge,
  Lock,
  Repeat,
  Send,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
} from "lucide-react";

type NodeTone = "trigger" | "operational" | "ai" | "alert" | "action";

type AgentNode = {
  badge: string;
  connectorLabel?: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  tone: NodeTone;
};

type ConfigField = {
  label: string;
  suffix?: string;
  value: string;
};

type FeaturedAgent = {
  config: ConfigField[];
  description: string;
  icon: ComponentType<{ className?: string }>;
  id: string;
  name: string;
  nodes: AgentNode[];
  subtitle: string;
  templateHref?: string;
  version: string;
};

const toneStyles: Record<NodeTone, { badge: string; iconBox: string }> = {
  trigger: {
    badge: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    iconBox: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
  operational: {
    badge: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
    iconBox: "bg-muted text-muted-foreground",
  },
  ai: {
    badge: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
    iconBox: "bg-indigo-500/12 text-indigo-600 dark:text-indigo-400",
  },
  alert: {
    badge: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
    iconBox: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  },
  action: {
    badge: "bg-amber-500/14 text-amber-600 dark:text-amber-400",
    iconBox: "bg-amber-500/14 text-amber-600 dark:text-amber-400",
  },
};

const featuredAgents: FeaturedAgent[] = [
  {
    id: "vault-rebalancing",
    name: "Vault Rebalancing",
    subtitle: "Uniswap v3 Portfolio Mgr",
    icon: Gauge,
    version: "V1.0.0",
    description:
      "Watches a liquidity position's price band and rebalances the vault back to target weights when it drifts out of range.",
    nodes: [
      { icon: Calendar, title: "Schedule", badge: "Trigger", tone: "trigger" },
      { icon: Gauge, title: "Drift Check", badge: "Operational", tone: "operational", connectorLabel: "Out of range" },
      { icon: Repeat, title: "Rebalance", badge: "Action", tone: "action" },
      { icon: Send, title: "Telegram Alert", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Position", value: "ETH / USDC 0.05%" },
      { label: "Target Range", value: "± 4.0", suffix: "%" },
      { label: "Min Rebalance Gap", value: "6", suffix: "HRS" },
      { label: "Telegram Chat ID", value: "@vault_ops" },
    ],
  },
  {
    id: "whale-watcher",
    name: "Whale Watcher",
    subtitle: "Large Transfer Alerts",
    icon: Wallet,
    version: "V1.0.0",
    description:
      "Monitors a Uniswap pair contract for large transactions from specific wallets. AI summarizes each whale trade and sends real-time alerts to your Telegram.",
    templateHref: "/dashboard/workflows/builder?template=whale-wallet-monitor",
    nodes: [
      { icon: FileText, title: "Smart Contract", badge: "Trigger", tone: "trigger" },
      { icon: Cpu, title: "TX Filter", badge: "Operational", tone: "operational", connectorLabel: "Match" },
      { icon: Bot, title: "AI Summary", badge: "AI", tone: "ai" },
      { icon: Send, title: "Telegram Alert", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Contract Address", value: "0xB4e1...6F2a" },
      { label: "Watched Wallet", value: "0x28C6...e9D1" },
      { label: "Min Transaction Size", value: "$50,000", suffix: "USD" },
      { label: "Telegram Chat ID", value: "@my_whale_alerts" },
    ],
  },
  {
    id: "nightly-wallet-report",
    name: "Nightly Wallet Report",
    subtitle: "Multi-Wallet AI Digest",
    icon: FileText,
    version: "V1.0.0",
    description:
      "Runs every night, pulls balances and activity across all tracked wallets, and sends an AI-written digest of the day's movements.",
    nodes: [
      { icon: Calendar, title: "Cron Schedule", badge: "Trigger", tone: "trigger" },
      { icon: Wallet, title: "Wallet Snapshot", badge: "Operational", tone: "operational" },
      { icon: Bot, title: "AI Digest", badge: "AI", tone: "ai", connectorLabel: "Summarize" },
      { icon: Send, title: "Telegram Report", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Schedule", value: "0 22 * * *" },
      { label: "Timezone", value: "UTC" },
      { label: "Tracked Wallets", value: "6 wallets" },
      { label: "Telegram Chat ID", value: "@nightly_digest" },
    ],
  },
  {
    id: "dca-automation",
    name: "DCA Automation",
    subtitle: "Scheduled Token Purchases",
    icon: Repeat,
    version: "V1.0.0",
    description:
      "Buys a fixed amount of a token on a recurring schedule, with an optional price-band guardrail before each purchase executes.",
    nodes: [
      { icon: Calendar, title: "Cron Schedule", badge: "Trigger", tone: "trigger" },
      { icon: SlidersHorizontal, title: "Price Guard", badge: "Operational", tone: "operational", connectorLabel: "In band" },
      { icon: Coins, title: "Swap", badge: "Action", tone: "action" },
      { icon: Send, title: "Fill Notice", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Token", value: "SOL" },
      { label: "Amount per Buy", value: "$100", suffix: "USD" },
      { label: "Frequency", value: "Weekly" },
      { label: "Max Slippage", value: "50", suffix: "BPS" },
    ],
  },
  {
    id: "ltv-monitoring",
    name: "LTV Monitoring",
    subtitle: "Liquidation Protection",
    icon: Shield,
    version: "V1.0.0",
    description:
      "Tracks the loan-to-value ratio on a lending position and alerts you the moment it crosses your safety threshold.",
    nodes: [
      { icon: Calendar, title: "Health Poll", badge: "Trigger", tone: "trigger" },
      { icon: Gauge, title: "LTV Threshold", badge: "Operational", tone: "operational", connectorLabel: "Breach" },
      { icon: Send, title: "Urgent Alert", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Position", value: "0x9aF2...11Bd" },
      { label: "Alert LTV", value: "78", suffix: "%" },
      { label: "Poll Interval", value: "60", suffix: "SEC" },
      { label: "Telegram Chat ID", value: "@ltv_guard" },
    ],
  },
  {
    id: "rug-pull-detection",
    name: "Rug Pull Detection",
    subtitle: "Token Safety Scanner",
    icon: ShieldAlert,
    version: "V1.0.0",
    description:
      "Scans newly listed tokens for liquidity locks, mint authority, and holder concentration, then flags high-risk launches.",
    nodes: [
      { icon: FileText, title: "New Listing", badge: "Trigger", tone: "trigger" },
      { icon: ShieldAlert, title: "Risk Scan", badge: "Operational", tone: "operational" },
      { icon: Bot, title: "AI Verdict", badge: "AI", tone: "ai", connectorLabel: "High risk" },
      { icon: Send, title: "Warning Alert", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Source", value: "Birdeye" },
      { label: "Min Liquidity", value: "$10,000", suffix: "USD" },
      { label: "Max Holder Concentration", value: "30", suffix: "%" },
      { label: "Telegram Chat ID", value: "@rug_radar" },
    ],
  },
  {
    id: "smart-limit-orders",
    name: "Smart Limit Orders",
    subtitle: "Auto Take Profit",
    icon: TrendingUp,
    version: "V1.0.0",
    description:
      "Watches a token's price feed and executes a take-profit swap automatically once your target level is reached.",
    nodes: [
      { icon: TrendingUp, title: "Price Feed", badge: "Trigger", tone: "trigger" },
      { icon: SlidersHorizontal, title: "Target Hit", badge: "Operational", tone: "operational", connectorLabel: "Reached" },
      { icon: Coins, title: "Take Profit", badge: "Action", tone: "action" },
      { icon: Send, title: "Fill Notice", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Token", value: "JUP / USDC" },
      { label: "Target Price", value: "$1.25", suffix: "USD" },
      { label: "Sell Size", value: "40", suffix: "%" },
      { label: "Max Slippage", value: "75", suffix: "BPS" },
    ],
  },
  {
    id: "yield-scout",
    name: "Yield Scout",
    subtitle: "Daily APR Finder",
    icon: Coins,
    version: "V1.0.0",
    description:
      "Surveys lending and LP markets each day, ranks the top yields above your floor, and delivers an AI-summarized shortlist.",
    nodes: [
      { icon: Calendar, title: "Daily Cron", badge: "Trigger", tone: "trigger" },
      { icon: Gauge, title: "APR Filter", badge: "Operational", tone: "operational", connectorLabel: "Above floor" },
      { icon: Bot, title: "AI Shortlist", badge: "AI", tone: "ai" },
      { icon: Send, title: "Telegram Digest", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Markets", value: "Kamino, Marginfi" },
      { label: "Min APR", value: "8.0", suffix: "%" },
      { label: "Results", value: "Top 5" },
      { label: "Telegram Chat ID", value: "@yield_scout" },
    ],
  },
  {
    id: "transaction-security-scanner",
    name: "Transaction Security Scanner",
    subtitle: "Pre-Trade Safety Check",
    icon: Shield,
    version: "V1.0.0",
    description:
      "Simulates an inbound transaction before signing, screens it for known threats, and blocks the route if anything looks unsafe.",
    nodes: [
      { icon: FileText, title: "TX Request", badge: "Trigger", tone: "trigger" },
      { icon: Shield, title: "Simulate", badge: "Operational", tone: "operational" },
      { icon: Bot, title: "AI Safety Score", badge: "AI", tone: "ai", connectorLabel: "Unsafe" },
      { icon: Send, title: "Block & Alert", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Wallet", value: "0x44Ae...02Cc" },
      { label: "Risk Threshold", value: "70", suffix: "/100" },
      { label: "Auto-Block", value: "Enabled" },
      { label: "Telegram Chat ID", value: "@tx_guard" },
    ],
  },
  {
    id: "scheduled-token-transfers",
    name: "Scheduled Token Transfers",
    subtitle: "Crypto Payroll & Recurring Payments",
    icon: Calendar,
    version: "V1.0.0",
    description:
      "Sends recurring token payments to a list of recipients on a fixed schedule — ideal for payroll, retainers, and subscriptions.",
    nodes: [
      { icon: Calendar, title: "Payroll Cron", badge: "Trigger", tone: "trigger" },
      { icon: SlidersHorizontal, title: "Balance Check", badge: "Operational", tone: "operational", connectorLabel: "Funded" },
      { icon: Coins, title: "Batch Transfer", badge: "Action", tone: "action" },
      { icon: Send, title: "Receipt", badge: "Alert", tone: "alert" },
    ],
    config: [
      { label: "Token", value: "USDC" },
      { label: "Recipients", value: "12 wallets" },
      { label: "Schedule", value: "0 9 1 * *" },
      { label: "Total per Run", value: "$24,000", suffix: "USD" },
    ],
  },
];

export function FeaturedAgentsPreview() {
  const [activeId, setActiveId] = useState(featuredAgents[1]?.id ?? featuredAgents[0]!.id);
  const activeAgent =
    featuredAgents.find((agent) => agent.id === activeId) ?? featuredAgents[0]!;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.34)]">
      <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)_19rem]">
        {/* Featured agents sidebar */}
        <aside className="border-b border-border p-5 lg:border-b-0 lg:border-r">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Featured Agents
          </div>
          <div className="mt-4 grid gap-1">
            {featuredAgents.map((agent) => {
              const isActive = agent.id === activeAgent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setActiveId(agent.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border border-border bg-background shadow-sm"
                      : "border border-transparent hover:bg-muted/60"
                  }`}
                >
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-sm font-semibold ${
                        isActive ? "text-foreground" : "text-foreground/70"
                      }`}
                    >
                      {agent.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {agent.subtitle}
                    </span>
                  </span>
                  {isActive ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Flow diagram */}
        <div className="relative border-b border-border bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px] p-6 lg:border-b-0 lg:border-r">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Interactive Preview
          </div>

          <div className="mx-auto mt-10 flex max-w-xs flex-col items-center">
            {activeAgent.nodes.map((node, index) => (
              <FlowNode
                key={`${activeAgent.id}-${node.title}`}
                node={node}
                isFirst={index === 0}
                isLast={index === activeAgent.nodes.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Configuration panel */}
        <aside className="p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/12 px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-400">
              Live Template
            </span>
            <span className="rounded-md border border-border px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {activeAgent.version}
            </span>
          </div>

          <h3 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
            {activeAgent.name}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{activeAgent.description}</p>

          <div className="mt-7 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Configuration
          </div>

          <div className="mt-4 grid gap-4">
            {activeAgent.config.map((field) => (
              <div key={field.label}>
                <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                    {field.value}
                  </span>
                  {field.suffix ? (
                    <span className="text-xs font-medium text-muted-foreground">{field.suffix}</span>
                  ) : null}
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>

          {activeAgent.templateHref ? (
            <Link
              href={activeAgent.templateHref}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Use this template
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function FlowNode({
  isFirst,
  isLast,
  node,
}: {
  isFirst: boolean;
  isLast: boolean;
  node: AgentNode;
}) {
  const tone = toneStyles[node.tone];
  const Icon = node.icon;

  return (
    <div className="flex w-full flex-col items-center">
      {/* incoming connector */}
      <div className="flex flex-col items-center">
        {isFirst ? (
          <span className="h-1.5 w-1.5 rounded-full bg-border" aria-hidden="true" />
        ) : null}
        <span className="h-5 w-px bg-border" aria-hidden="true" />
      </div>

      <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone.iconBox}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{node.title}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${tone.badge}`}>
          {node.badge}
        </span>
      </div>

      {/* outgoing connector + optional label */}
      <div className="flex flex-col items-center">
        <span className="h-5 w-px bg-border" aria-hidden="true" />
        {node.connectorLabel ? (
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
            {node.connectorLabel}
          </span>
        ) : null}
        {node.connectorLabel ? <span className="h-5 w-px bg-border" aria-hidden="true" /> : null}
        {isLast ? <span className="h-1.5 w-1.5 rounded-full bg-border" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
