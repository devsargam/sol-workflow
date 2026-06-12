import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  Copy,
  Filter,
  Gauge,
  ListChecks,
  Route,
  Scale,
  Shield,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import { LandingCta } from "@/components/landing/landing-cta";
import { HeroWorkflowPrompt, WorkflowPrompt } from "@/components/landing/workflow-prompt";

const floatingLabels = [
  ["PRICE TRIGGER", "border-[#f08c46] bg-[#f08c46] text-[#171717]", "left-[5%] top-[10%]"],
  ["WALLET MOVED", "border-[#cf7be6] bg-[#cf7be6] text-[#171717]", "left-[34%] top-[14%]"],
  ["RISK CHECK", "border-[#71d6ee] bg-[#71d6ee] text-[#171717]", "right-[12%] top-[18%]"],
  ["TAKE PROFIT", "border-[#b6e458] bg-[#b6e458] text-[#171717]", "right-[4%] top-[43%]"],
  ["REDUCE EXPOSURE", "border-[#c7b5ff] bg-[#c7b5ff] text-[#171717]", "right-[28%] top-[48%]"],
  ["STOP LOSS", "border-[#f5dc58] bg-[#f5dc58] text-[#171717]", "right-[15%] top-[60%]"],
  ["SLIPPAGE CHECK", "border-[#05fea2] bg-[#05fea2] text-[#171717]", "right-[5%] bottom-[27%]"],
  ["POSITION SAFE", "border-[#8fe6b4] bg-[#8fe6b4] text-[#171717]", "left-[54%] bottom-[3%]"],
];

const traderWorkflows = [
  {
    title: "PRICE TRIGGERS",
    detail: "Watch SOL, token, or market price levels and start the next step only when the rule is hit.",
    icon: Zap,
  },
  {
    title: "WALLET MOVEMENT",
    detail: "Inspect a watched wallet transfer, classify the move, and decide whether it matters.",
    icon: Wallet,
  },
  {
    title: "STOP LOSS",
    detail: "Cut exposure when the downside rule is met instead of waiting for a manual exit.",
    icon: TrendingDown,
  },
  {
    title: "TAKE PROFIT",
    detail: "Scale out at target levels, lock gains, and report the execution back to the agent.",
    icon: TrendingUp,
  },
  {
    title: "TRAILING PROTECTION",
    detail: "Move the exit as price runs so the workflow protects upside without constant supervision.",
    icon: Target,
  },
  {
    title: "POSITION SIZING",
    detail: "Check max size, available balance, exposure, and risk limits before any order routes.",
    icon: Scale,
  },
  {
    title: "LIQUIDATION GUARD",
    detail: "Watch margin risk and reduce exposure before a perps position gets too close to danger.",
    icon: Shield,
  },
  {
    title: "FUNDING CHECK",
    detail: "React when funding or carry gets expensive enough to change the trade setup.",
    icon: Gauge,
  },
  {
    title: "SLIPPAGE ROUTING",
    detail: "Check liquidity, price impact, and route quality before approving the onchain move.",
    icon: Route,
  },
  {
    title: "COPY-WALLET FILTER",
    detail: "Follow a wallet only when the transfer passes size, token, and context checks.",
    icon: Copy,
  },
  {
    title: "REBALANCE RULES",
    detail: "Bring a portfolio back inside target bands after price movement or new fills.",
    icon: ListChecks,
  },
  {
    title: "TIME-BASED EXITS",
    detail: "Close or review stale trades when the setup has expired and the target never came.",
    icon: Timer,
  },
  {
    title: "PREDICTION ODDS",
    detail: "Watch odds shifts, position size, and resolution windows before acting.",
    icon: BarChart3,
  },
  {
    title: "EXECUTION REPORTS",
    detail: "Send fills, failed routes, and final transaction results back to the trader and agent.",
    icon: Bell,
  },
  {
    title: "RISK STACKING",
    detail: "Combine price, wallet, liquidity, and exposure checks before one approved action runs.",
    icon: Shield,
  },
];

const marketUseCases = [
  {
    title: "PERPS",
    detail: "Build flows for funding changes, liquidation risk, leverage limits, stop-loss logic, and exposure reduction.",
  },
  {
    title: "PREDICTION MARKETS",
    detail: "Track market odds, position size, resolution windows, and wallet activity before routing the next move.",
  },
  {
    title: "SPOT TRADING",
    detail: "Watch token targets, wallet inflows, portfolio drift, and take-profit rules without turning every move into a manual task.",
  },
];

const workflowNodes = [
  {
    eyebrow: "CONNECTED",
    title: "OpenClaw",
    detail: "Trading agent connected with permission to run the workflow",
    logo: "/agent-openclaw.png",
  },
  {
    eyebrow: "SIGNAL",
    title: "Market signal",
    detail: "Price, wallet movement, fill, or transfer event is detected",
    icon: Zap,
  },
  {
    eyebrow: "RULE",
    title: "Trading rule",
    detail: "Check threshold, exposure, wallet context, and risk limits",
    icon: Filter,
  },
  {
    eyebrow: "ACTION",
    title: "Onchain action",
    detail: "Take profit, reduce exposure, rebalance, or route a swap",
    icon: Box,
  },
  {
    eyebrow: "REPORT",
    title: "Execution report",
    detail: "Send the transaction result back to the agent and trader",
    logo: "/agent-openclaw.png",
  },
];

const primaryCtaClass =
  "min-h-12 items-center justify-center gap-3 border border-white/80 bg-[#f7f7f2] px-6 font-mono text-[11px] font-bold tracking-[0.12em] text-black transition-colors hover:border-[#05fea2] hover:bg-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

const loopingTraderWorkflows = [...traderWorkflows, ...traderWorkflows];

const footerGroups: { title: string; links: [string, string][] }[] = [
  {
    title: "PRODUCT",
    links: [
      ["Workflows", "#workflows"],
      ["Use Cases", "/usecases"],
      ["Trading Rules", "#trader-workflows"],
      ["Build Flow", "/dashboard"],
    ],
  },
  {
    title: "RESOURCES",
    links: [
      ["Docs", "/docs"],
      ["Templates", "/usecases"],
      ["Examples", "#trader-workflows"],
      ["Agents", "#trader-workflows"],
    ],
  },
  {
    title: "COMPANY",
    links: [
      ["Twitter / X", "https://x.com/dolphinflow_"],
      ["Telegram", "https://t.me/+IugCwFOqngplOGFl"],
      ["Contact", "mailto:hello@dolphinflow.xyz"],
    ],
  },
];

function SectionBackdrop({ intensity = "default" }: { intensity?: "default" | "soft" }) {
  return (
    <>
      <div className={`flow-grid pointer-events-none absolute inset-0 ${intensity === "soft" ? "opacity-55" : "opacity-70"}`} />
      <div className={`terminal-blueprint pointer-events-none absolute inset-0 ${intensity === "soft" ? "opacity-45" : "opacity-60"}`} />
      <div className={`sdp-atmosphere pointer-events-none absolute inset-0 ${intensity === "soft" ? "opacity-45" : "opacity-60"}`} />
    </>
  );
}

function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function WorkflowConnector() {
  return (
    <div className="flex h-8 items-center justify-center lg:h-auto" aria-hidden="true">
      <span className="h-8 w-px bg-white/30 lg:h-px lg:w-full" />
      <ArrowRight className="absolute hidden size-3.5 translate-x-2 text-white/55 lg:block" />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-black text-[#f7f7f2]">
      <section className="relative min-h-screen border-b border-white/20">
        <div className="flow-grid pointer-events-none absolute inset-0" />
        <div className="terminal-blueprint pointer-events-none absolute inset-0" />
        <div className="sdp-atmosphere pointer-events-none absolute inset-0" />

        <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/20 px-5 md:px-8">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#202020]"
          >
            <Image
              src="/logo.jpg"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-sm border border-white/30 grayscale"
            />
            <span className="text-sm font-semibold tracking-[-0.06em]">DOLPHIN FLOW</span>
          </Link>

          <nav className="hidden items-center gap-8 font-mono text-[10px] tracking-[0.12em] text-white/70 md:flex">
            <a href="#workflows" className="min-h-10 py-3 transition-colors hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2]">
              WORKFLOWS
            </a>
            <a href="#how-it-works" className="min-h-10 py-3 transition-colors hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2]">
              HOW IT WORKS
            </a>
            <a href="#markets" className="min-h-10 py-3 transition-colors hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2]">
              MARKETS
            </a>
            <a href="#trader-workflows" className="min-h-10 py-3 transition-colors hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2]">
              TRADERS
            </a>
            <Link href="/docs" className="min-h-10 py-3 transition-colors hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2]">
              DOCS
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://x.com/dolphinflow_"
              target="_blank"
              rel="noreferrer"
              aria-label="Dolphin Flow on X"
              className="grid size-11 place-items-center border border-white/35 text-white/70 hover:border-white hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <XLogo className="size-4" />
            </a>
            <LandingCta className={`hidden sm:flex ${primaryCtaClass}`}>
              GET STARTED <ArrowRight className="size-3.5" aria-hidden="true" />
            </LandingCta>
          </div>
        </header>

        {floatingLabels.map(([label, color, position], index) => (
          <span
            key={label}
            className={`flow-label ${index % 2 ? "flow-drift-slow" : "flow-drift"} absolute z-10 hidden border px-3 py-1.5 font-mono text-xs font-bold tracking-[-0.08em] text-[#202020] md:block ${color} ${position}`}
          >
            {label}
          </span>
        ))}

        <div className="relative z-20 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col justify-center px-5 py-12 md:px-8 lg:py-8">
          <div className="max-w-6xl">
            <h1 className="text-[clamp(3.2rem,6.5vw,6.8rem)] font-semibold leading-[0.9] tracking-[-0.085em]">
              TURN TRADING RULES
              <br />
              INTO AGENT WORKFLOWS.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
              Dolphin Flow helps traders turn trade logic into workflows their agents can run on Solana.
              Each workflow combines triggers, conditions, actions, and notifications, so agents can monitor
              markets, execute approved moves, and report back.
            </p>
          </div>
          <HeroWorkflowPrompt />
        </div>
      </section>

      <section id="how-it-works" className="relative grid border-b border-white/20 md:grid-cols-2">
        <SectionBackdrop intensity="soft" />
        <div className="relative border-b border-white/20 px-5 py-16 md:border-r md:border-b-0 md:px-8 md:py-24">
          <h2 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.94] tracking-[-0.075em] md:text-7xl">
            TRADING RULES
            <br />
            THAT KEEP RUNNING.
          </h2>
        </div>
        <div className="relative overflow-hidden px-5 py-16 md:px-8 md:py-24">
          <p className="relative max-w-2xl text-xl leading-9 text-white/70">
            Dolphin Flow turns trading logic into reusable Solana workflows: detect the trigger,
            check the condition, execute the approved action, and notify the agent with the result.
          </p>
        </div>
      </section>

      <section id="workflows" className="relative border-b border-white/20 px-5 py-20 md:px-8">
        <SectionBackdrop intensity="soft" />
        <div className="relative mx-auto max-w-7xl">
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.07em] md:text-6xl">
            SIGNAL. RULE. ACTION. REPORT.
          </h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_32px_1fr_32px_1fr_32px_1fr_32px_1fr]">
            {workflowNodes.map((node, index) => {
              const Icon = "icon" in node ? node.icon : null;
              const logo = "logo" in node ? node.logo : null;

              return (
                <Fragment key={node.title}>
                  <article className="agent-card-glow min-h-56 border border-white/25 p-5">
                    <div className="mt-5 flex items-center gap-3">
                      <span className="grid size-14 place-items-center border border-[#05fea2]/25 text-[#05fea2]">
                        {logo ? (
                          <Image src={logo} alt="" width={38} height={38} className="size-10 object-contain" />
                        ) : Icon ? (
                          <Icon className="size-7" aria-hidden="true" />
                        ) : null}
                      </span>
                      <p className="font-mono text-[9px] tracking-[0.14em] text-white/45">{node.eyebrow}</p>
                    </div>
                    <h3 className="mt-8 text-2xl font-semibold tracking-[-0.06em]">{node.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/55">{node.detail}</p>
                  </article>
                  {index < workflowNodes.length - 1 ? <WorkflowConnector /> : null}
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>

      <section id="markets" className="relative border-b border-white/20 px-5 py-20 md:px-8">
        <SectionBackdrop intensity="soft" />
        <div className="relative mx-auto max-w-7xl">
          <div className="h-px w-28 bg-[#05fea2]" />
          <h2 className="mt-6 max-w-5xl text-4xl font-semibold tracking-[-0.07em] md:text-6xl">
            BUILT FOR THE PLACES
            <br />
            TRADERS ALREADY MOVE.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/55">
            Perps, prediction markets, and spot positions all create the same problem: the trader knows the
            rule, but the agent needs a workflow to keep watching, checking, executing, and reporting.
          </p>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {marketUseCases.map((useCase) => (
              <article key={useCase.title} className="agent-card-glow min-h-64 border border-white/25 p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-mono text-xl font-bold tracking-[0.08em]">{useCase.title}</h3>
                  <span className="grid size-12 place-items-center border border-[#05fea2]/35 text-[#05fea2]">
                    <BarChart3 className="size-6" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-10 text-sm leading-6 text-white/55">{useCase.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trader-workflows" className="relative border-b border-white/20 px-5 py-20 md:px-8">
        <SectionBackdrop />
        <div className="relative mx-auto max-w-7xl">
          <div className="h-px w-28 bg-[#05fea2]" />
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.07em] md:text-6xl">
            FROM TRADING LOGIC
            <br />
            TO ONCHAIN EXECUTION.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/58">
            Useful trader automation is not another alert. It is a repeatable rule that checks context,
            protects the position, routes the approved move, and reports what actually happened.
          </p>
          <div className="workflow-marquee-shell mt-12 overflow-hidden border-y border-white/15 py-4">
            <div className="workflow-marquee flex w-max gap-4">
              {loopingTraderWorkflows.map((workflow, index) => {
                const Icon = workflow.icon;

                return (
                  <article key={`${workflow.title}-${index}`} className="agent-card-glow w-[330px] shrink-0 border border-white/22 p-5">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <h3 className="font-mono text-[15px] font-bold tracking-[0.12em]">{workflow.title}</h3>
                        <p className="mt-4 text-sm leading-6 text-white/55">{workflow.detail}</p>
                      </div>
                      <span className="grid size-12 shrink-0 place-items-center border border-[#05fea2]/25 text-[#05fea2]">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="workflow-marquee workflow-marquee-reverse mt-4 flex w-max gap-4">
              {loopingTraderWorkflows
                .slice()
                .reverse()
                .map((workflow, index) => {
                  const Icon = workflow.icon;

                  return (
                    <article key={`${workflow.title}-reverse-${index}`} className="agent-card-glow w-[330px] shrink-0 border border-white/22 p-5">
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <h3 className="font-mono text-[15px] font-bold tracking-[0.12em]">{workflow.title}</h3>
                          <p className="mt-4 text-sm leading-6 text-white/55">{workflow.detail}</p>
                        </div>
                        <span className="grid size-12 shrink-0 place-items-center border border-[#05fea2]/25 text-[#05fea2]">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
          <div className="mt-8 grid gap-4 border border-white/20 bg-black/70 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="grid size-16 place-items-center border border-white/15">
              <Image src="/agent-openclaw.png" alt="" width={44} height={44} className="size-11 object-contain" />
            </span>
            <div>
              <p className="mt-2 text-xl font-semibold tracking-[-0.05em]">Connect OpenClaw.</p>
              <p className="mt-2 text-sm leading-6 text-white/55">
                The workflow is the trade logic. OpenClaw is where the job runs and where execution reports return.
              </p>
            </div>
            <LandingCta className={`inline-flex ${primaryCtaClass}`}>
              BUILD FLOW <ArrowRight className="size-3.5" aria-hidden="true" />
            </LandingCta>
          </div>
        </div>
      </section>

      <section id="create-workflow" className="relative px-5 py-20 md:px-8">
        <SectionBackdrop intensity="soft" />
        <div className="relative mx-auto max-w-7xl">
          <h2 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.07em] md:text-6xl">
            DESCRIBE THE TRADE RULE.
            <br />
            LET THE AGENT RUN IT.
          </h2>
          <div className="mt-10">
            <WorkflowPrompt />
          </div>
          <div className="mt-12 flex flex-wrap gap-3 font-mono text-[10px] tracking-[0.1em] text-white/50">
            <span className="border border-white/15 px-3 py-2">MONITOR WALLETS</span>
            <span className="border border-white/15 px-3 py-2">CHECK RISK</span>
            <span className="border border-white/15 px-3 py-2">EXECUTE APPROVED MOVES</span>
            <span className="border border-white/15 px-3 py-2">REPORT RESULTS</span>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/20 px-5 py-24 md:px-8 md:py-32">
        <SectionBackdrop />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_50%_100%,rgba(5,254,162,0.14),transparent_56%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="h-px w-28 bg-[#05fea2]" />
          <h2 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] md:text-7xl">
            STOP WRITING ALERTS.
            <br />
            START RUNNING FLOWS.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 md:text-lg">
            For traders who want agents to do more than notify. Build workflows for risk, execution,
            and follow-through on Solana.
          </p>
          <LandingCta className={`mt-10 inline-flex ${primaryCtaClass}`}>
            GET STARTED <ArrowRight className="size-4" aria-hidden="true" />
          </LandingCta>
        </div>
      </section>

      <footer className="relative border-t border-white/20 px-5 py-12 md:px-8">
        <SectionBackdrop intensity="soft" />
        <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-3 rounded-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Image
                src="/logo.jpg"
                alt=""
                width={34}
                height={34}
                className="size-8 rounded-sm border border-white/30 grayscale"
              />
              <span className="text-sm font-semibold tracking-[-0.06em]">DOLPHIN FLOW</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
              Dolphin Flow helps traders turn trading logic into workflows their agents can run on Solana.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 font-mono text-[10px] tracking-[0.1em] text-white/50">
              <span className="border border-[#05fea2]/35 px-3 py-2 text-[#05fea2]">SOLANA</span>
              <span className="border border-white/15 px-3 py-2">AGENT WORKFLOWS</span>
              <span className="border border-white/15 px-3 py-2">TRADER RULES</span>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[10px] font-bold tracking-[0.14em] text-white/45">{group.title}</h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => {
                    const isExternal = href.startsWith("http") || href.startsWith("mailto:");
                    const linkClass =
                      "inline-flex min-h-8 items-center text-sm text-white/62 transition-colors hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2] focus-visible:ring-offset-2 focus-visible:ring-offset-black";

                    return (
                      <li key={label}>
                        {href === "/dashboard" ? (
                          <LandingCta className={linkClass}>{label}</LandingCta>
                        ) : (
                          <a
                            href={href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noreferrer" : undefined}
                            className={linkClass}
                          >
                            {label}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/15 pt-6 font-mono text-[10px] tracking-[0.1em] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 DOLPHIN FLOW. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#05fea2]">BUILDING FOR SOLANA TRADERS</span>
            <a
              href="https://x.com/dolphinflow_"
              target="_blank"
              rel="noreferrer"
              aria-label="Dolphin Flow on X"
              className="grid size-9 place-items-center border border-white/20 text-white/65 transition-colors hover:border-[#05fea2] hover:text-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <XLogo className="size-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
