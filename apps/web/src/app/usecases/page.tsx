import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Bell,
  CheckCircle2,
  Coins,
  Droplets,
  MessageCircle,
  SlidersHorizontal,
} from "lucide-react";
import { DarkNav } from "@/components/layout/dark-nav";
import { FeaturedAgentsPreview } from "@/components/landing/featured-agents-preview";
import { UseTemplateButton } from "./use-template-button";

export const metadata: Metadata = {
  title: "Use Cases | Dolphinflow",
  description:
    "Automation templates for wallet monitoring, copy trading, treasury approvals, token alerts, and validator operations.",
};

type UseCase = {
  accent: string;
  action: string;
  copy: string;
  filter: string;
  imageSrc?: string;
  imageTone: string;
  imageTitle: string;
  reasons: string[];
  templateHref?: string;
  title: string;
  trigger: string;
};

const useCases: UseCase[] = [
  {
    title: "Whale Wallet Monitor",
    trigger: "Wallet balance changes",
    filter: "Change > 0.9 SOL",
    action: "Send Telegram alert",
    copy: "Monitor large wallet balance changes and alert your team instantly.",
    imageSrc: "/usecases/whale.png",
    imageTitle: "Whale activity",
    imageTone: "from-[#14f195]/24 via-[#29d3ff]/16 to-[#9945ff]/22",
    accent: "#14f195",
    templateHref: "/dashboard/workflows/builder?template=whale-wallet-monitor",
    reasons: ["Extremely understandable", "Feels real-time and alive", "Strong crypto relevance"],
  },
  {
    title: "Treasury Approval Flow",
    trigger: "Multisig transaction created",
    filter: "Amount > threshold",
    action: "Request approval in Discord",
    copy: "Route treasury approvals through automated review flows.",
    imageSrc: "/usecases/vault.png",
    imageTitle: "Approval queue",
    imageTone: "from-[#9945ff]/24 via-[#ff5ea8]/14 to-[#f3d9ac]/18",
    accent: "#c9aaff",
    reasons: [
      "Shows workflow agents",
      "Demonstrates approvals + coordination",
      "Feels enterprise-grade",
    ],
  },
  {
    title: "Copy Trading",
    trigger: "Signed trade signal webhook",
    filter: "Lead wallet + size guardrails",
    action: "Mirror approved swap",
    copy: "Mirror trusted trader signals with configurable limits before any route executes.",
    imageSrc: "/usecases/copy-trading.png",
    imageTitle: "Copy signal",
    imageTone: "from-[#14f195]/22 via-[#facc15]/14 to-[#29d3ff]/20",
    accent: "#14f195",
    templateHref: "/dashboard/workflows/builder?template=copy-trading",
    reasons: [
      "Clear trading monetization path",
      "Built-in risk guardrails",
      "Webhook friendly for strategy providers",
    ],
  },
  {
    title: "Token Listing Alerts",
    trigger: "Birdeye new token listing",
    filter: "Liquidity > $10k",
    action: "Notify Telegram",
    copy: "Detect new token launches and react in real time.",
    imageSrc: "/usecases/token.png",
    imageTitle: "New listing",
    imageTone: "from-[#29d3ff]/22 via-[#14f195]/14 to-[#f3d9ac]/20",
    accent: "#29d3ff",
    templateHref: "/dashboard/workflows/builder?template=token-listing-alerts",
    reasons: [
      "Trading audience instantly understands",
      "High perceived value",
      "Good motion/UI potential",
    ],
  },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <DarkNav links={[]} sticky />

      <section className="border-b w-full border-border bg-background">
        <div className="mx-auto w-full gap-10 px-4 py-14">
          <div>
            <h1 className="text-center mt-5 text-4xl font-bold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              Production-ready use cases.
            </h1>
            <p className="text-center mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Start from proven automation patterns for monitoring, approvals, copy trading,
              trading alerts, and validator operations.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-14">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Featured agents
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Browse live templates, preview the flow, and review the configuration before you deploy.
          </p>
        </div>
        <FeaturedAgentsPreview />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-5 lg:grid-cols-2">
          {useCases.map((useCase) => (
            <UseCaseCard key={useCase.title} useCase={useCase} />
          ))}
        </div>
      </section>
    </main>
  );
}

function UseCaseCard({ useCase }: { useCase: UseCase }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_70px_rgba(0,0,0,0.06)] transition duration-300 hover:border-foreground/20 hover:shadow-[0_28px_90px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.34)]">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_15rem] h-full">
        <div className="flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mt-4 text-2xl font-semibold tracking-normal text-foreground">
                {useCase.title}
              </h2>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{useCase.copy}</p>

          <div className="mt-6 grid gap-3">
            <FlowStep
              icon={<Droplets className="h-4 w-4" />}
              label="Trigger"
              value={useCase.trigger}
            />
            <FlowStep
              icon={<SlidersHorizontal className="h-4 w-4" />}
              label="Filter"
              value={useCase.filter}
            />
            <FlowStep icon={<Bell className="h-4 w-4" />} label="Action" value={useCase.action} />
          </div>

          <div className="pt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Why it works
            </div>
            <div className="mt-3 grid gap-2">
              {useCase.reasons.map((reason) => (
                <div key={reason} className="flex items-center gap-2 text-sm text-foreground/82">
                  <CheckCircle2
                    className="h-4 w-4 shrink-0"
                    style={{ color: useCase.accent }}
                    aria-hidden="true"
                  />
                  {reason}
                </div>
              ))}
            </div>
            {useCase.templateHref ? <UseTemplateButton href={useCase.templateHref} /> : null}
          </div>
        </div>

        <TemplateImageSlot useCase={useCase} />
      </div>
    </article>
  );
}

function FlowStep({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/72 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

function TemplateImageSlot({ useCase }: { useCase: UseCase }) {
  return (
    <div className="border-t border-border bg-muted/35 p-5 md:border-l md:border-t-0">
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.25rem] border border-border bg-background">
        {useCase.imageSrc ? (
          <Image
            src={useCase.imageSrc}
            alt={`${useCase.title} preview`}
            fill
            sizes="(min-width: 768px) 240px, calc(100vw - 72px)"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`relative flex h-full w-full flex-col justify-between bg-gradient-to-br ${useCase.imageTone} p-4`}
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/14 bg-black/36 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                Square image slot
              </span>
              <Coins className="h-5 w-5 text-white/78" aria-hidden="true" />
            </div>
            <div className="grid gap-2">
              <div className="h-2 rounded-full bg-white/24" />
              <div className="h-2 w-8/12 rounded-full bg-white/18" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="h-14 rounded-xl border border-white/12 bg-black/24" />
                <div className="h-14 rounded-xl border border-white/12 bg-black/18" />
                <div className="h-14 rounded-xl border border-white/12 bg-black/24" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-semibold">{useCase.imageTitle}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-white/70">
                Replace this placeholder with a 1:1 artwork, product screenshot, or generated
                preview.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
