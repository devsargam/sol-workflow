"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-12 items-center justify-center rounded-full border-2 border-neutral-200 bg-white p-3",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

Circle.displayName = "Circle";

export function WorkflowAnimation({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Triggers (left side)
  const trigger1Ref = useRef<HTMLDivElement>(null);
  const trigger2Ref = useRef<HTMLDivElement>(null);
  const trigger3Ref = useRef<HTMLDivElement>(null);
  const trigger4Ref = useRef<HTMLDivElement>(null);

  // Center (Sol Workflow)
  const centerRef = useRef<HTMLDivElement>(null);

  // Outputs (right side)
  const output1Ref = useRef<HTMLDivElement>(null);
  const output2Ref = useRef<HTMLDivElement>(null);
  const output3Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "relative flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white p-10",
        className
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-2xl flex-row items-stretch justify-between gap-10">
        {/* Triggers - Left Side */}
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={trigger1Ref}>
            <Icons.solana />
          </Circle>
          <Circle ref={trigger2Ref}>
            <Icons.clock />
          </Circle>
          <Circle ref={trigger3Ref}>
            <Icons.wallet />
          </Circle>
          <Circle ref={trigger4Ref}>
            <Icons.code />
          </Circle>
        </div>

        {/* Center - Sol Workflow */}
        <div className="flex flex-col justify-center">
          <Circle ref={centerRef} className="size-24">
            <Icons.workflow />
          </Circle>
        </div>

        {/* Outputs - Right Side */}
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={output1Ref}>
            <Icons.discord />
          </Circle>
          <Circle ref={output2Ref}>
            <Icons.telegram />
          </Circle>
          <Circle ref={output3Ref}>
            <Icons.webhook />
          </Circle>
        </div>
      </div>

      {/* Beams from triggers to center */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={trigger1Ref}
        toRef={centerRef}
        curvature={-40}
        gradientStartColor="#171717"
        gradientStopColor="#525252"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={trigger2Ref}
        toRef={centerRef}
        curvature={-20}
        gradientStartColor="#171717"
        gradientStopColor="#525252"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={trigger3Ref}
        toRef={centerRef}
        curvature={20}
        gradientStartColor="#171717"
        gradientStopColor="#525252"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={trigger4Ref}
        toRef={centerRef}
        curvature={40}
        gradientStartColor="#171717"
        gradientStopColor="#525252"
      />

      {/* Beams from center to outputs */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={output1Ref}
        curvature={-30}
        gradientStartColor="#525252"
        gradientStopColor="#171717"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={output2Ref}
        gradientStartColor="#525252"
        gradientStopColor="#171717"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={output3Ref}
        curvature={30}
        gradientStartColor="#525252"
        gradientStopColor="#171717"
      />
    </div>
  );
}

const Icons = {
  // Solana logo - official style
  solana: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M6.04 16.2a.63.63 0 01.45-.19h13.18c.28 0 .43.35.23.55l-2.65 2.65a.63.63 0 01-.45.19H3.62a.32.32 0 01-.23-.55l2.65-2.65z" />
      <path d="M6.04 4.6a.65.65 0 01.45-.18h13.18c.28 0 .43.34.23.54L17.25 7.6a.63.63 0 01-.45.19H3.62a.32.32 0 01-.23-.55L6.04 4.6z" />
      <path d="M17.25 10.35a.63.63 0 00-.45-.19H3.62a.32.32 0 00-.23.55l2.65 2.65c.12.12.28.19.45.19h13.18c.28 0 .43-.35.23-.55l-2.65-2.65z" />
    </svg>
  ),

  // Clock - clean timer icon
  clock: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  // Wallet - clean wallet icon
  wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M19 7V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 7h4a2 2 0 012 2v6a2 2 0 01-2 2h-4a3 3 0 010-6h0a3 3 0 000-4z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
    </svg>
  ),

  // Code - terminal/code brackets
  code: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Workflow center - hub/node icon
  workflow: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-12">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
    </svg>
  ),

  // Discord - official logo style
  discord: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 00-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 00-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.02.03.05.03.07.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" />
    </svg>
  ),

  // Telegram - official logo style
  telegram: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.74 3.99-1.74 6.65-2.89 7.99-3.45 3.8-1.6 4.59-1.88 5.1-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.27-.04.42z" />
    </svg>
  ),

  // Webhook - API/connection icon
  webhook: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};
