"use client";

import Link from "next/link";
import { DarkNav } from "@/components/layout/dark-nav";

/* ─── SVG layout constants ────────────────────────────────────── */

const NW = 86,
  NH = 22;

type NType = "trigger" | "filter" | "action" | "agent";
const TC: Record<NType, string> = {
  trigger: "#14F195",
  filter: "#FFB800",
  action: "#9945FF",
  agent: "#29D3FF",
};
const OPENCLAW_IMAGE = "/agents/openclaw.png";

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
  { x: 80, y: 212, type: "trigger", label: "Market Signal", delay: 0.5 },
  { x: 248, y: 212, type: "agent", label: "OpenClaw", delay: 0.9 },
  { x: 416, y: 160, type: "filter", label: "Risk Check", delay: 1.3 },
  { x: 416, y: 268, type: "action", label: "Send Response", delay: 1.3 },
];
const D_CHAIN1_EDGES: WFEdge[] = [
  { d: ep(166, 223, 248, 223), color: TC.agent, drawDelay: 0.8 },
  { d: ep(334, 223, 416, 171), color: TC.filter, drawDelay: 1.2 },
  { d: ep(334, 223, 416, 279), color: TC.action, drawDelay: 1.2 },
];

// ── Desktop: Chain 2 (lower-right, 70% opacity) ────────────────
const D_CHAIN2_NODES: WFNode[] = [
  { x: 868, y: 580, type: "trigger", label: "Cron Schedule", delay: 0.7 },
  { x: 1036, y: 580, type: "agent", label: "Hermes Agent", delay: 1.1 },
  { x: 1204, y: 580, type: "action", label: "Execute Task", delay: 1.5 },
];
const D_CHAIN2_EDGES: WFEdge[] = [
  { d: ep(954, 591, 1036, 591), color: TC.agent, drawDelay: 1.0 },
  { d: ep(1122, 591, 1204, 591), color: TC.action, drawDelay: 1.4 },
];

// ── Mobile: centered in x:512–930 ──────────────────────────────
const M_CHAIN1_NODES: WFNode[] = [
  { x: 520, y: 175, type: "trigger", label: "Signal", delay: 0.5 },
  { x: 666, y: 175, type: "agent", label: "OpenClaw", delay: 0.9 },
  { x: 812, y: 175, type: "action", label: "Response", delay: 1.3 },
];
const M_CHAIN1_EDGES: WFEdge[] = [
  { d: ep(606, 186, 666, 186), color: TC.agent, drawDelay: 0.8 },
  { d: ep(752, 186, 812, 186), color: TC.action, drawDelay: 1.2 },
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

interface AgentCard {
  id: string;
  x: number;
  y: number;
  name: string;
  status: string;
  signal: string;
  responseLines: string[];
  action: string;
  delay: number;
  compact?: boolean;
}

const D_AGENT_CARDS: AgentCard[] = [
  {
    id: "desktop-openclaw",
    x: 86,
    y: 340,
    name: "OpenClaw",
    status: "response ready",
    signal: "Wallet signal",
    responseLines: ["Risky transfer detected.", "Draft ready for review."],
    action: "Review",
    delay: 1.45,
  },
  {
    id: "desktop-hermes",
    x: 1034,
    y: 430,
    name: "Hermes Agent",
    status: "task running",
    signal: "Cron fired",
    responseLines: ["Balances checked.", "Execution ready."],
    action: "Execute",
    delay: 1.65,
  },
];

const M_AGENT_CARDS: AgentCard[] = [
  {
    id: "mobile-openclaw-bottom",
    x: 638,
    y: 706,
    name: "OpenClaw",
    status: "response ready",
    signal: "Signal",
    responseLines: ["Response ready"],
    action: "Review",
    delay: 1.65,
    compact: true,
  },
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
            {n.label === "OpenClaw" && (
              <image
                href={OPENCLAW_IMAGE}
                x={n.x + 8}
                y={n.y + 4}
                width="14"
                height="14"
                preserveAspectRatio="xMidYMid meet"
              />
            )}
            <text
              x={n.x + (n.label === "OpenClaw" ? 28 : 10)}
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

function renderAgentCards(cards: AgentCard[], className?: string) {
  return (
    <g className={className}>
      {cards.map((card) => {
        const compact = Boolean(card.compact);
        const cardWidth = compact ? 164 : 210;
        const cardHeight = compact ? 76 : 112;
        const avatarSize = compact ? 18 : 24;
        const avatarX = compact ? card.x + 12 : card.x + 11;
        const avatarY = compact ? card.y + 11 : card.y + 10;
        const titleX = card.x + (card.name === "OpenClaw" ? (compact ? 38 : 42) : compact ? 32 : 34);
        const titleY = card.y + (compact ? 21 : 22);
        const signalWidth = compact ? 64 : 94;
        const messageWidth = compact ? 128 : 174;
        const messageHeight = compact ? 18 : 28;
        const statusX = compact ? card.x + 92 : card.x + 128;

        return (
          <g
            key={card.id}
            style={
              {
                opacity: 0,
                transformBox: "fill-box",
                transformOrigin: "center",
                animationDelay: `${card.delay}s`,
                animation: "solCardIn 0.65s cubic-bezier(0.16,1,0.3,1) forwards",
              } as React.CSSProperties
            }
          >
            <rect
              x={card.x}
              y={card.y}
              width={cardWidth}
              height={cardHeight}
              rx="8"
              fill="var(--hero-card-bg)"
              stroke="var(--hero-node-border)"
              strokeWidth="0.75"
            />
            {card.name === "OpenClaw" ? (
              <image
                href={OPENCLAW_IMAGE}
                x={avatarX}
                y={avatarY}
                width={avatarSize}
                height={avatarSize}
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <circle
                cx={card.x + (compact ? 21 : 20)}
                cy={card.y + (compact ? 20 : 22)}
                r={compact ? 4 : 5}
                fill={TC.agent}
                opacity="0.95"
              />
            )}
            <text
              x={titleX}
              y={titleY}
              dominantBaseline="central"
              fontSize={compact ? "9" : "11"}
              fontWeight="650"
              fill="var(--hero-card-title)"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {card.name}
            </text>
            <text
              x={statusX}
              y={titleY}
              dominantBaseline="central"
              fontSize={compact ? "6.5" : "8"}
              fill={TC.trigger}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {card.status}
            </text>

            <g
              style={
                {
                  opacity: 0,
                  animationDelay: `${card.delay + 0.22}s`,
                  animation: "solMessageIn 0.45s ease forwards",
                } as React.CSSProperties
              }
            >
              <rect
                x={card.x + 18}
                y={card.y + (compact ? 38 : 44)}
                width={signalWidth}
                height={compact ? 15 : 17}
                rx={compact ? "7.5" : "8.5"}
                fill="var(--hero-chip-bg)"
                stroke="var(--hero-node-border)"
                strokeWidth="0.6"
              />
              <circle
                cx={card.x + 29}
                cy={card.y + (compact ? 45.5 : 52.5)}
                r={compact ? 2 : 2.4}
                fill={TC.trigger}
                opacity="0.9"
              />
              <text
                x={card.x + 36}
                y={card.y + (compact ? 46 : 53)}
                dominantBaseline="central"
                fontSize={compact ? "6.8" : "7.5"}
                fill="var(--hero-node-text)"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {card.signal}
              </text>
            </g>

            <g
              style={
                {
                  opacity: 0,
                  animationDelay: `${card.delay + 0.38}s`,
                  animation: "solMessageIn 0.45s ease forwards",
                } as React.CSSProperties
              }
            >
              <rect
                x={card.x + 18}
                y={card.y + (compact ? 56 : 68)}
                width={messageWidth}
                height={messageHeight}
                rx="6"
                fill="var(--hero-message-bg)"
              />
              {card.responseLines.map((line, i) => (
                <text
                  key={line}
                  x={card.x + 29}
                  y={card.y + (compact ? 68 : 79) + i * 10.5}
                  fontSize={compact ? "7.2" : "8"}
                  fill="var(--hero-card-title)"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {line}
                </text>
              ))}
            </g>

            {!compact && (
              <g
                style={
                  {
                    opacity: 0,
                    animationDelay: `${card.delay + 0.54}s`,
                    animation: "solMessageIn 0.45s ease forwards",
                  } as React.CSSProperties
                }
              >
                <rect x={card.x + 140} y={card.y + 46} width="52" height="18" rx="9" fill="var(--hero-action-bg)" />
                <text
                  x={card.x + 166}
                  y={card.y + 55}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7.5"
                  fontWeight="650"
                  fill="var(--hero-card-title)"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {card.action}
                </text>
              </g>
            )}
          </g>
        );
      })}
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
          @keyframes solCardIn {
            from { opacity:0; transform:translateY(8px) scale(.98) }
            to   { opacity:1; transform:translateY(0) scale(1) }
          }
          @keyframes solLinePulse {
            0%,100% { opacity:.28 }
            50%     { opacity:.7 }
          }
          @keyframes solMessageIn {
            from { opacity:0; transform:translateY(3px) }
            to   { opacity:1; transform:translateY(0) }
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
      {renderAgentCards(D_AGENT_CARDS, "sol-desktop")}

      {renderChain(M_CHAIN1_NODES, M_CHAIN1_EDGES, 1, "sol-mobile")}
      {renderAgentCards(M_AGENT_CARDS, "sol-mobile")}
    </svg>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <HeroSVG />
        <DarkNav links={[{ label: "Workflows", href: "/workflows" }]} />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-20 pt-10 text-center sm:px-6 sm:pb-28 sm:pt-0">
          <h1 className="max-w-[18rem] text-3xl font-bold leading-[1.08] tracking-normal text-foreground sm:max-w-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            onchain agent workflows for soalan
          </h1>
          <p className="mt-5 max-w-[19rem] text-sm leading-relaxed text-foreground/45 sm:max-w-md sm:text-base">
            Give agents like OpenClaw and Hermes on-chain signals, schedules, and tools so they can
            reason, respond, and execute without glue code.
          </p>
          <div className="mt-8 flex w-full max-w-[18rem] flex-col gap-3 sm:mt-10 sm:w-auto sm:max-w-none sm:flex-row">
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
