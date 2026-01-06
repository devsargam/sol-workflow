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
          <Circle ref={centerRef} className="size-16">
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
  // Solana logo
  solana: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M4.5 18.5L7.5 15.5H19.5L16.5 18.5H4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 5.5L7.5 8.5H19.5L16.5 5.5H4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 12L7.5 9H19.5L16.5 12H4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Clock for cron/schedule
  clock: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 6V12L16 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Wallet
  wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </svg>
  ),

  // Code for program logs
  code: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M8 6L3 12L8 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 6L21 12L16 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Workflow center icon
  workflow: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-8">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M5.63604 5.63604L7.75736 7.75736"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16.2426 16.2426L18.364 18.364"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.63604 18.364L7.75736 16.2426"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16.2426 7.75736L18.364 5.63604"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),

  // Discord
  discord: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M9.5 11.5C9.5 12.3284 8.82843 13 8 13C7.17157 13 6.5 12.3284 6.5 11.5C6.5 10.6716 7.17157 10 8 10C8.82843 10 9.5 10.6716 9.5 11.5Z"
        fill="currentColor"
      />
      <path
        d="M17.5 11.5C17.5 12.3284 16.8284 13 16 13C15.1716 13 14.5 12.3284 14.5 11.5C14.5 10.6716 15.1716 10 16 10C16.8284 10 17.5 10.6716 17.5 11.5Z"
        fill="currentColor"
      />
      <path
        d="M5.5 7C5.5 5.61929 6.61929 4.5 8 4.5H16C17.3807 4.5 18.5 5.61929 18.5 7V15.5C18.5 16.8807 17.3807 18 16 18H12L8.5 20.5V18H8C6.61929 18 5.5 16.8807 5.5 15.5V7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Telegram
  telegram: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <path
        d="M21 5L10 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 5L14 21L10 13L3 10L21 5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),

  // Webhook
  webhook: () => (
    <svg viewBox="0 0 24 24" fill="none" className="size-6">
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 9V12L6 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12L18 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
