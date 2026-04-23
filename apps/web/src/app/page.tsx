"use client";

import Link from "next/link";
import { DarkNav } from "@/components/layout/dark-nav";

/* ─── SVG layout constants ────────────────────────────────────── */

const NW = 86,
  NH = 22;

type NType = "trigger" | "filter" | "action";
const TC: Record<NType, string> = {
  trigger: "#14F195",
  filter: "#FFB800",
  action: "#9945FF",
};

function ep(x1: number, y1: number, x2: number, y2: number) {
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}

interface WFNode {
  x: number;
  y: number;
  type: NType;
  label: string;
  delay: number;
}
interface WFEdge {
  d: string;
  color: string;
  drawDelay: number;
}

// ── Desktop: Chain 1 (upper-left) ──────────────────────────────
const D_CHAIN1_NODES: WFNode[] = [
  { x: 80, y: 212, type: "trigger", label: "Token Transfer", delay: 0.5 },
  { x: 248, y: 212, type: "filter", label: "Amount > 100", delay: 0.9 },
  { x: 416, y: 160, type: "action", label: "Discord Alert", delay: 1.3 },
  { x: 416, y: 268, type: "action", label: "Send SOL", delay: 1.3 },
];
const D_CHAIN1_EDGES: WFEdge[] = [
  { d: ep(166, 223, 248, 223), color: TC.filter, drawDelay: 0.8 },
  { d: ep(334, 223, 416, 171), color: TC.action, drawDelay: 1.2 },
  { d: ep(334, 223, 416, 279), color: TC.action, drawDelay: 1.2 },
];

// ── Desktop: Chain 2 (lower-right, 70% opacity) ────────────────
const D_CHAIN2_NODES: WFNode[] = [
  { x: 868, y: 580, type: "trigger", label: "Cron Schedule", delay: 0.7 },
  { x: 1036, y: 580, type: "filter", label: "Balance Check", delay: 1.1 },
  { x: 1204, y: 580, type: "action", label: "Transfer", delay: 1.5 },
];
const D_CHAIN2_EDGES: WFEdge[] = [
  { d: ep(954, 591, 1036, 591), color: TC.filter, drawDelay: 1.0 },
  { d: ep(1122, 591, 1204, 591), color: TC.action, drawDelay: 1.4 },
];

// ── Mobile: centered in x:512–930 ──────────────────────────────
const M_CHAIN1_NODES: WFNode[] = [
  { x: 520, y: 175, type: "trigger", label: "Token Transfer", delay: 0.5 },
  { x: 666, y: 175, type: "filter", label: "Amount > 100", delay: 0.9 },
  { x: 812, y: 175, type: "action", label: "Discord Alert", delay: 1.3 },
];
const M_CHAIN1_EDGES: WFEdge[] = [
  { d: ep(606, 186, 666, 186), color: TC.filter, drawDelay: 0.8 },
  { d: ep(752, 186, 812, 186), color: TC.action, drawDelay: 1.2 },
];

const M_CHAIN2_NODES: WFNode[] = [
  { x: 520, y: 580, type: "trigger", label: "Cron Schedule", delay: 0.7 },
  { x: 666, y: 580, type: "filter", label: "Balance Check", delay: 1.1 },
  { x: 812, y: 580, type: "action", label: "Transfer", delay: 1.5 },
];
const M_CHAIN2_EDGES: WFEdge[] = [
  { d: ep(606, 591, 666, 591), color: TC.filter, drawDelay: 1.0 },
  { d: ep(752, 591, 812, 591), color: TC.action, drawDelay: 1.4 },
];

// ── Decorative markers ──────────────────────────────────────────
const MARKERS: [number, number][] = [
  [648, 144],
  [720, 360],
  [576, 504],
  [720, 648],
  [144, 72],
  [1296, 144],
  [1368, 432],
];
const CROSSES: [number, number][] = [
  [720, 280],
  [900, 420],
  [560, 460],
];

/* ─── Shared chain renderer ───────────────────────────────────── */

function renderChain(nodes: WFNode[], edges: WFEdge[], groupOpacity = 1, className?: string) {
  return (
    <g opacity={groupOpacity} className={className}>
      {edges.map((e, i) => {
        const fd = e.drawDelay + 0.65;
        return (
          <g key={i}>
            <path
              d={e.d}
              fill="none"
              stroke={e.color}
              strokeWidth="0.75"
              strokeOpacity="0.12"
              strokeDasharray="300"
              strokeDashoffset="300"
              style={
                {
                  opacity: 0,
                  animationDelay: `${e.drawDelay}s, ${e.drawDelay}s`,
                  animation: "solIn 0.3s ease forwards, solDraw 0.65s ease forwards",
                } as React.CSSProperties
              }
            />
            <path
              d={e.d}
              fill="none"
              stroke={e.color}
              strokeWidth="1"
              strokeOpacity="0.65"
              strokeDasharray="2 18"
              strokeLinecap="round"
              style={
                {
                  opacity: 0,
                  animationDelay: `${fd}s, ${fd}s`,
                  animation: "solIn 0.2s ease forwards, solFlow 0.55s linear infinite",
                } as React.CSSProperties
              }
            />
          </g>
        );
      })}

      {nodes.map((n, i) => (
        <g key={i}>
          {n.type === "trigger" && (
            <rect
              x={n.x - 7}
              y={n.y - 7}
              width={NW + 14}
              height={NH + 14}
              rx="6"
              fill="none"
              stroke={TC.trigger}
              strokeWidth="0.75"
              style={
                {
                  opacity: 0,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  animationDelay: `${n.delay}s`,
                  animation: "solRipple 2.8s ease-out infinite",
                } as React.CSSProperties
              }
            />
          )}
          <g
            style={
              {
                opacity: 0,
                transformBox: "fill-box",
                transformOrigin: "center",
                animationDelay: `${n.delay}s`,
                animation: "solNodeIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
              } as React.CSSProperties
            }
          >
            <rect
              x={n.x}
              y={n.y}
              width={NW}
              height={NH}
              rx="3"
              fill="var(--hero-node-bg)"
              stroke="var(--hero-node-border)"
              strokeWidth="0.75"
            />
            <rect x={n.x} y={n.y} width="3" height={NH} rx="1" fill={TC[n.type]} opacity="0.9" />
            <text
              x={n.x + 10}
              y={n.y + NH / 2}
              dominantBaseline="central"
              fontSize="8.5"
              fill="var(--hero-node-text)"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {n.label}
            </text>
          </g>
        </g>
      ))}
    </g>
  );
}

/* ─── Hero SVG ────────────────────────────────────────────────── */

function HeroSVG() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <style>{`
          @keyframes solGridIn { from{opacity:0} to{opacity:1} }
          @keyframes solIn     { from{opacity:0} to{opacity:1} }
          @keyframes solNodeIn {
            from { opacity:0; transform:translateY(-7px) }
            to   { opacity:1; transform:translateY(0) }
          }
          @keyframes solDraw   { from{stroke-dashoffset:300} to{stroke-dashoffset:0} }
          @keyframes solFlow   { from{stroke-dashoffset:20}  to{stroke-dashoffset:0} }
          @keyframes solRipple {
            0%   { opacity:.45; transform:scale(1)   }
            100% { opacity:0;   transform:scale(1.9) }
          }
          @keyframes solPulse  { 0%,100%{opacity:.14} 50%{opacity:.42} }

          .sol-grid  { opacity:0; animation:solGridIn 2.2s ease 0.2s forwards }
          .sol-cross { animation:solPulse 5s ease-in-out infinite }

          @media (max-width:767px)  { .sol-desktop { display:none } }
          @media (min-width:768px)  { .sol-mobile  { display:none } }
        `}</style>

        <pattern id="g" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M 72 0 L 0 0 0 72" fill="none" stroke="var(--hero-grid)" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="gf" cx="50%" cy="40%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="15%" stopColor="var(--hero-gf-color)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--hero-gf-color)" stopOpacity="0" />
        </radialGradient>
        <mask id="gm">
          <rect width="1440" height="900" fill="url(#gf)" />
        </mask>
      </defs>

      <rect className="sol-grid" width="1440" height="900" fill="url(#g)" mask="url(#gm)" />

      {MARKERS.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 3}
          y={y - 3}
          width="6"
          height="6"
          fill="var(--hero-marker)"
          transform={`rotate(45,${x},${y})`}
          style={{ opacity: 0, animation: `solIn 0.4s ease ${0.15 + i * 0.1}s forwards` }}
        />
      ))}

      {CROSSES.map(([x, y], i) => (
        <g
          key={i}
          className="sol-cross"
          stroke="var(--hero-cross)"
          strokeWidth="0.75"
          style={{ animationDelay: `${i * 1.6}s` }}
        >
          <line x1={x - 8} y1={y} x2={x + 8} y2={y} />
          <line x1={x} y1={y - 8} x2={x} y2={y + 8} />
        </g>
      ))}

      {renderChain(D_CHAIN1_NODES, D_CHAIN1_EDGES, 1, "sol-desktop")}
      {renderChain(D_CHAIN2_NODES, D_CHAIN2_EDGES, 0.7, "sol-desktop")}

      {renderChain(M_CHAIN1_NODES, M_CHAIN1_EDGES, 1, "sol-mobile")}
      {renderChain(M_CHAIN2_NODES, M_CHAIN2_EDGES, 0.7, "sol-mobile")}
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <HeroSVG />
        <DarkNav links={[{ label: "Workflows", href: "/workflows" }]} />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center sm:pb-28">
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.06] tracking-[-0.03em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            On-chain automation for Solana
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-foreground/40 sm:max-w-md sm:text-base">
            Connect triggers to actions. No code required.
          </p>
          <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row">
            <Link
              href="/workflows"
              className="rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background text-center transition-colors hover:bg-foreground/90"
            >
              Start building
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
