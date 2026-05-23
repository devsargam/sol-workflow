"use client";

import { useEffect, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type OrbitIconKind =
  | "openclaw"
  | "risk"
  | "hermes"
  | "wallet"
  | "cron"
  | "webhook"
  | "telegram"
  | "discord";

type OrbitIcon = {
  accent: string;
  delay: string;
  floatX: string;
  floatY: string;
  glow: string;
  kind: OrbitIconKind;
  name: string;
  size: "standard" | "large";
  x: number;
  y: number;
};

type OrbitBeamPathProps = {
  d: string;
  delay: string;
  gradient: "orbitBeamA" | "orbitBeamB";
};

const orbitIcons: OrbitIcon[] = [
  {
    name: "OpenClaw",
    kind: "openclaw",
    x: 12,
    y: 35,
    size: "large",
    floatX: "10px",
    floatY: "-12px",
    delay: "-0.4s",
    accent: "#14f195",
    glow: "rgba(20, 241, 149, 0.34)",
  },
  {
    name: "Risk approval",
    kind: "risk",
    x: 54,
    y: 7,
    size: "standard",
    floatX: "-10px",
    floatY: "-9px",
    delay: "-3.1s",
    accent: "#ff5ea8",
    glow: "rgba(255, 94, 168, 0.34)",
  },
  {
    name: "Hermes execution",
    kind: "hermes",
    x: 90,
    y: 33,
    size: "large",
    floatX: "-8px",
    floatY: "14px",
    delay: "-2.6s",
    accent: "#29d3ff",
    glow: "rgba(41, 211, 255, 0.30)",
  },
  {
    name: "Wallet signal",
    kind: "wallet",
    x: 13,
    y: 80,
    size: "standard",
    floatX: "-8px",
    floatY: "12px",
    delay: "-1.8s",
    accent: "#f3d9ac",
    glow: "rgba(243, 217, 172, 0.24)",
  },
  {
    name: "Cron scheduler",
    kind: "cron",
    x: 93,
    y: 59,
    size: "standard",
    floatX: "12px",
    floatY: "9px",
    delay: "-1.2s",
    accent: "#f3d9ac",
    glow: "rgba(243, 217, 172, 0.22)",
  },
  {
    name: "Webhook trigger",
    kind: "webhook",
    x: 49,
    y: 93,
    size: "standard",
    floatX: "13px",
    floatY: "-7px",
    delay: "-4.4s",
    accent: "#9b7cff",
    glow: "rgba(155, 124, 255, 0.34)",
  },
  {
    name: "Telegram notification",
    kind: "telegram",
    x: 81,
    y: 83,
    size: "standard",
    floatX: "-11px",
    floatY: "-12px",
    delay: "-0.9s",
    accent: "#29d3ff",
    glow: "rgba(41, 211, 255, 0.26)",
  },
  {
    name: "Discord notification",
    kind: "discord",
    x: 7,
    y: 57,
    size: "standard",
    floatX: "9px",
    floatY: "11px",
    delay: "-3.8s",
    accent: "#c9aaff",
    glow: "rgba(154, 101, 242, 0.30)",
  },
];

export default function HomePage() {
  const { ready, authenticated, login, logout, walletAddress } = useWalletAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/dashboard");
    }
  }, [ready, authenticated, router]);

  return (
    <>
      <LandingNav
        authenticated={authenticated}
        login={login}
        logout={logout}
        ready={ready}
        walletAddress={walletAddress}
      />
      <main className="flex min-h-screen flex-col lg:h-[calc(100svh-3.5rem)] lg:min-h-0 lg:overflow-hidden">
        <div className="grid h-4 w-full shrink-0 grid-cols-[0.5rem_0.5rem_minmax(0,1fr)_0.5rem_0.5rem] sm:h-16 sm:grid-cols-[1rem_3rem_minmax(0,1fr)_3rem_1rem] lg:h-12 lg:grid-cols-[1.5rem_4.5rem_minmax(0,1fr)_4.5rem_1.5rem]">
          <div></div>
          <div className="border-l border-dashed border-black/20 dark:border-white/20"></div>
          <div className="border-x dark:border-white/20 border-black/20 border-dashed"></div>
          <div className="border-r border-dashed border-black/20 dark:border-white/20"></div>
          <div></div>
        </div>
        <div className="grid w-full flex-1 grid-cols-[0.5rem_0.5rem_minmax(0,1fr)_0.5rem_0.5rem] sm:grid-cols-[1rem_3rem_minmax(0,1fr)_3rem_1rem] lg:min-h-0 lg:grid-cols-[1.5rem_4.5rem_minmax(0,1fr)_4.5rem_1.5rem]">
          <div className="min-h-4 border-y border-dashed border-black/20 dark:border-white/20 sm:min-h-16"></div>
          <div className="min-h-4 border-y border-l border-dashed border-black/20 dark:border-white/20 sm:min-h-16"></div>
          <section className="flex min-h-[calc(100svh-2rem)] min-w-0 flex-col overflow-hidden border border-black/20 bg-white dark:border-white/20 dark:bg-black sm:min-h-[calc(100svh-8rem)] lg:min-h-0">
            <div className="relative z-10 grid flex-1 items-center gap-10 px-6 pb-8 pt-4 sm:px-10 sm:pb-10 lg:min-h-0 lg:grid-cols-[0.9fr_1.1fr] lg:gap-4 lg:px-14 lg:py-8 xl:px-20">
              <div className="max-w-3xl pt-8 lg:pt-0">
                <h1 className="max-w-[720px] text-5xl font-bold leading-none tracking-normal text-black dark:text-white sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
                  <span className="block">Onchain</span>
                  <span className="block">Automation</span>
                  <span className="block">Workflows</span>
                  <span className="block">
                    for <span className="text-[#078C5A] dark:text-[#14f195]">AI Agents</span>
                  </span>
                </h1>

                <p className="mt-6 max-w-[34rem] text-base leading-7 text-black/70 dark:text-white/82 sm:text-lg">
                  React to on-chain events, run actions, and coordinate notifications in real time.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button variant="default" size="lg" onClick={login}>
                    Start building
                    <ArrowRight />
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/docs">Read docs</Link>
                  </Button>
                </div>
              </div>

              <OrbitShowcase />
            </div>
          </section>
          <div className="min-h-4 border-y border-r border-dashed border-black/20 dark:border-white/20 sm:min-h-16"></div>
          <div className="min-h-4 border-y border-dashed border-black/20 dark:border-white/20 sm:min-h-16"></div>
        </div>
        <div className="grid h-4 w-full shrink-0 grid-cols-[0.5rem_0.5rem_minmax(0,1fr)_0.5rem_0.5rem] sm:h-16 sm:grid-cols-[1rem_3rem_minmax(0,1fr)_3rem_1rem] lg:h-12 lg:grid-cols-[1.5rem_4.5rem_minmax(0,1fr)_4.5rem_1.5rem]">
          <div></div>
          <div className="border-l border-dashed border-black/20 dark:border-white/20"></div>
          <div className="border-x dark:border-white/20 border-black/20 border-dashed"></div>
          <div className="border-r border-dashed border-black/20 dark:border-white/20"></div>
          <div></div>
        </div>
      </main>
    </>
  );
}

interface LandingNavProps {
  authenticated: boolean;
  login: () => void;
  logout: () => void;
  ready: boolean;
  walletAddress: string | null;
}

function LandingNav({ authenticated, login, logout, ready, walletAddress }: LandingNavProps) {
  return (
    <nav className="relative z-20  h-14 flex items-center justify-between px-4 sm:px-6 border-b border-black/20 dark:border-white/20">
      <Link href="/" className="flex items-center gap-2 text-black dark:text-white">
        <Image
          src="/logo.jpg"
          alt="Dolphinflow logo"
          width={34}
          height={34}
          className="h-9 w-9 rounded-xl object-cover"
          priority
        />
        <span className="hidden text-lg font-medium tracking-normal sm:inline-block">
          dolphinflow
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/usecases"
          // className="hidden rounded-full border border-black/14 bg-black/6 px-4 py-2 text-sm font-semibold text-black/76 backdrop-blur-md transition hover:bg-black/20 hover:text-black dark:border-white/14 dark:bg-white/8 dark:text-white/78 dark:hover:bg-white/12 dark:hover:text-white sm:inline-flex"
          className="text-sm/6 dark:text-white text-gray-900 underline-offset-2 underline"
        >
          Use cases
        </Link>
        <ThemeToggle
        // className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-black/18 bg-white/24 text-black backdrop-blur-md transition hover:bg-white/36 dark:border-white/18 dark:bg-black/16 dark:text-white dark:hover:bg-black/24 min-[360px]:flex"
        />

        {authenticated ? (
          <div className="flex items-center gap-3">
            {walletAddress ? (
              <span className="hidden rounded-full border border-black/15 bg-white/24 px-3 py-2 font-mono text-xs text-black/78 backdrop-blur-md dark:border-white/15 dark:bg-black/16 dark:text-white/78 sm:inline">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            ) : null}
            <button
              onClick={logout}
              className="whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(155,124,255,0.18)] transition hover:bg-white/86 dark:bg-black/82 dark:text-white dark:shadow-[0_0_30px_rgba(155,124,255,0.25)] dark:hover:bg-black"
            >
              Log out
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-3 transition-opacity duration-300"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <Button onClick={login} variant="default" size="sm" className="h-auto px-4 py-2">
              Connect wallet
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

function OrbitShowcase() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[720px] items-center justify-center lg:mr-0 lg:max-w-[min(640px,calc(100svh-15rem))] xl:max-w-[min(720px,calc(100svh-15rem))]">
      <div className="absolute inset-[7%] rounded-full border border-black/20 orbit-ring-glow dark:border-white/16" />
      <div className="absolute inset-[18%] rounded-full border border-black/22 orbit-ring-glow [animation-delay:-2s] dark:border-white/18" />
      <div className="absolute inset-[30%] rounded-full border border-black/24 orbit-ring-glow [animation-delay:-4s] dark:border-white/20" />
      <div className="absolute inset-[4%] rounded-full bg-black/[0.075] dark:bg-white/[0.02]" />

      <svg
        className="orbit-beams pointer-events-none absolute inset-0 z-[1] h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="orbitBeamA" x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="var(--orbit-beam-warm)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--orbit-beam-warm)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--orbit-beam-cool)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orbitBeamB" x1="1" x2="0" y1="0" y2="1">
            <stop stopColor="var(--orbit-beam-cool)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--orbit-beam-muted)" stopOpacity="0.48" />
            <stop offset="1" stopColor="var(--orbit-beam-warm)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <OrbitBeamPath d="M12 35 L50 50" delay="-0.2s" gradient="orbitBeamA" />
        <OrbitBeamPath d="M7 57 L50 50" delay="-1.2s" gradient="orbitBeamB" />
        <OrbitBeamPath d="M13 80 L50 50" delay="-2.2s" gradient="orbitBeamA" />
        <OrbitBeamPath d="M50 50 L54 7" delay="-3.2s" gradient="orbitBeamB" />
        <OrbitBeamPath d="M50 50 L90 33" delay="-4.2s" gradient="orbitBeamA" />
        <OrbitBeamPath d="M50 50 L93 59" delay="-5.2s" gradient="orbitBeamB" />
        <OrbitBeamPath d="M50 50 L81 83" delay="-6.2s" gradient="orbitBeamA" />
      </svg>

      <div className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full border border-black/22 bg-white text-center backdrop-blur-md dark:border-white/16 dark:bg-black/62 sm:h-56 sm:w-56">
        <SolanaLogo className="h-20 w-20 sm:h-32 sm:w-32" />
      </div>

      {orbitIcons.map((icon) => (
        <OrbitIconBadge key={icon.name} icon={icon} />
      ))}
    </div>
  );
}

function OrbitBeamPath({ d, delay, gradient }: OrbitBeamPathProps) {
  return (
    <g style={{ "--beam-delay": delay } as CSSProperties}>
      <path className="orbit-beam-track" d={d} pathLength="100" />
      <path className="orbit-beam-packet" d={d} pathLength="100" stroke={`url(#${gradient})`} />
    </g>
  );
}

function OrbitIconBadge({ icon }: { icon: OrbitIcon }) {
  const positionStyle = {
    "--accent": icon.accent,
    "--delay": icon.delay,
    "--float-x": icon.floatX,
    "--float-y": icon.floatY,
    "--glow": icon.glow,
    left: `${icon.x}%`,
    top: `${icon.y}%`,
  } as CSSProperties;

  const sizeClass =
    icon.size === "large"
      ? "h-14 w-14 rounded-[1rem] sm:h-[4.75rem] sm:w-[4.75rem] sm:rounded-[1.4rem]"
      : "h-12 w-12 rounded-[0.9rem] sm:h-[4.35rem] sm:w-[4.35rem] sm:rounded-[1.4rem]";

  return (
    <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={positionStyle}>
      <div
        aria-label={icon.name}
        data-orbit-kind={icon.kind}
        className={`orbit-product flex items-center justify-center border border-black/18 bg-white/96 backdrop-blur-xl dark:border-white/12 dark:bg-black/80 ${sizeClass}`}
      >
        <IconRenderer kind={icon.kind} />
      </div>
    </div>
  );
}

function IconRenderer({ kind }: { kind: OrbitIconKind }) {
  switch (kind) {
    case "openclaw":
      return (
        <Image
          src="/agents/openclaw.png"
          alt="OpenClaw icon"
          width={44}
          height={44}
          className="h-8 w-8 object-contain sm:h-11 sm:w-11"
        />
      );
    case "risk":
      return (
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path
            d="M17 3.8L27 7.3V15.2C27 21.5 23 27.1 17 30.2C11 27.1 7 21.5 7 15.2V7.3L17 3.8Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="orbit-icon-detail"
            d="M12.2 17.2L15.4 20.4L22.1 13.7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
        </svg>
      );
    case "hermes":
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M7 24.5C15.7 7.8 27.4 6 34 8.2C27.5 11.6 23.5 15.6 21.9 20.2C19.2 20.5 16.4 21.7 13.5 24H28.9C25.1 29.6 18 32.3 7 24.5Z"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            className="orbit-icon-detail"
            d="M15 24L24.5 16.2"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2.2"
          />
        </svg>
      );
    case "wallet":
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect
            x="6"
            y="10"
            width="24"
            height="18"
            rx="5"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M10 10V8.8C10 6.9 11.7 5.5 13.6 5.9L24.3 8.1C25.6 8.4 26.5 9.5 26.5 10.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
          <circle className="orbit-icon-detail" cx="25" cy="19" r="2" fill="currentColor" />
        </svg>
      );
    case "cron":
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle
            cx="18"
            cy="18"
            r="12"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="orbit-icon-detail"
            d="M18 11V18L23 21"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M10 7L7 10M26 7L29 10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "webhook":
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle
            cx="11"
            cy="12"
            r="4"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="25"
            cy="12"
            r="4"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="25"
            r="4"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            className="orbit-icon-detail"
            d="M15 12H21M13.5 15.3L16.2 21.4M22.5 15.3L19.8 21.4"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      );
    case "telegram":
      return <TelegramLogo className="h-7 w-7 sm:h-9 sm:w-9" />;
    case "discord":
      return <DiscordLogo className="h-7 w-7 sm:h-9 sm:w-9" />;
    default:
      return null;
  }
}

function DiscordLogo({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <title>Discord</title>
      <path
        fill="currentColor"
        d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
      />
    </svg>
  );
}

function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <title>Telegram</title>
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

function SolanaLogo({ className }: { className?: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <title>Solana</title>
      <defs>
        <linearGradient
          id="solanaCenterA"
          x1="0"
          x2="24"
          y1="22.5"
          y2="17.2"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9945FF" />
          <stop offset="0.45" stopColor="#14F195" />
          <stop offset="1" stopColor="#00C2FF" />
        </linearGradient>
        <linearGradient
          id="solanaCenterB"
          x1="0"
          x2="24"
          y1="14.6"
          y2="9.4"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#00C2FF" />
          <stop offset="0.52" stopColor="#14F195" />
          <stop offset="1" stopColor="#9945FF" />
        </linearGradient>
        <linearGradient
          id="solanaCenterC"
          x1="0"
          x2="24"
          y1="6.8"
          y2="1.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9945FF" />
          <stop offset="0.48" stopColor="#14F195" />
          <stop offset="1" stopColor="#00C2FF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#solanaCenterA)"
        d="m23.8764 18.0313-3.962 4.1393a.9201.9201 0 0 1-.306.2106.9407.9407 0 0 1-.367.0742H.4599a.4689.4689 0 0 1-.2522-.0733.4513.4513 0 0 1-.1696-.1962.4375.4375 0 0 1-.0314-.2545.4438.4438 0 0 1 .117-.2298l3.9649-4.1393a.92.92 0 0 1 .3052-.2102.9407.9407 0 0 1 .3658-.0746H23.54a.4692.4692 0 0 1 .2523.0734.4531.4531 0 0 1 .1697.196.438.438 0 0 1 .0313.2547.4442.4442 0 0 1-.1169.2297z"
      />
      <path
        fill="url(#solanaCenterB)"
        d="M19.9144 9.6958a.9202.9202 0 0 0-.306-.2106.941.941 0 0 0-.367-.0742H.4599a.4687.4687 0 0 0-.2522.0734.4513.4513 0 0 0-.1696.1961.4376.4376 0 0 0-.0314.2546.444.444 0 0 0 .117.2297l3.9649 4.1394a.9204.9204 0 0 0 .3052.2102c.1154.049.24.0744.3658.0746H23.54a.469.469 0 0 0 .2523-.0734.453.453 0 0 0 .1697-.1961.4382.4382 0 0 0 .0313-.2546.4444.4444 0 0 0-.1169-.2297z"
      />
      <path
        fill="url(#solanaCenterC)"
        d="M.46 6.7225h18.7815a.9411.9411 0 0 0 .367-.0742.9202.9202 0 0 0 .306-.2106l3.962-4.1394a.4442.4442 0 0 0 .117-.2297.4378.4378 0 0 0-.0314-.2546.453.453 0 0 0-.1697-.196.469.469 0 0 0-.2523-.0734H4.7596a.941.941 0 0 0-.3658.0745.9203.9203 0 0 0-.3052.2102L.1246 5.9687a.4438.4438 0 0 0-.1169.2295.4375.4375 0 0 0 .0312.2544.4512.4512 0 0 0 .1692.196.4689.4689 0 0 0 .2518.0739z"
      />
    </svg>
  );
}
