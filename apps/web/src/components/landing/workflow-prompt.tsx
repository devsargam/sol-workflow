"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Plus, Sparkles } from "lucide-react";

import { useAuthGatedNavigation } from "@/components/landing/landing-cta";

const examples = [
  "Reduce exposure if SOL breaks my risk level",
  "Take profit when my token reaches target",
  "Check a wallet movement before routing a swap",
];

const heroPrompts = [
  "If SOL drops below my threshold, reduce exposure",
  "If this wallet moves, check the transfer before acting",
  "If a token hits my target, take profit",
  "If my exposure gets too high, rebalance the position",
];

function getBuilderHref(prompt: string) {
  return prompt ? `/dashboard?prompt=${encodeURIComponent(prompt)}` : "/dashboard";
}

export function WorkflowPrompt() {
  const navigate = useAuthGatedNavigation();
  const [prompt, setPrompt] = useState("If SOL drops below my threshold, reduce exposure");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(getBuilderHref(prompt.trim()));
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="prompt-glow pointer-events-none absolute left-[15%] top-10 h-40 w-[70%]" />
      <form
        onSubmit={handleSubmit}
        className="relative border border-white/25 bg-black/80 p-3 shadow-[0_16px_70px_rgba(0,0,0,0.45)] md:p-4"
      >
        <label htmlFor="workflow-prompt" className="sr-only">
          Describe the trading workflow you want to create
        </label>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <span className="grid size-12 shrink-0 place-items-center border border-white/20 text-white/80">
            <Plus className="size-6" aria-hidden="true" />
          </span>
          <input
            id="workflow-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-white placeholder:text-white/35 focus-visible:outline-none md:text-xl"
            placeholder="Create a workflow from a trading rule..."
            autoComplete="off"
          />
          <button
            type="submit"
            className="flex min-h-12 shrink-0 items-center justify-center gap-3 border border-white/80 bg-[#f7f7f2] px-5 font-mono text-[11px] font-bold tracking-[0.08em] text-black transition-colors hover:border-[#05fea2] hover:bg-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            GENERATE FLOW <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setPrompt(example)}
            className="min-h-10 border border-white/20 bg-black/45 px-3 font-mono text-[10px] tracking-[0.04em] text-white/65 hover:border-white/50 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HeroWorkflowPrompt() {
  const navigate = useAuthGatedNavigation();
  const [prompt, setPrompt] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const activePrompt = heroPrompts[promptIndex] ?? "";
    const isFinishedTyping = !isDeleting && prompt === activePrompt;
    const isFinishedDeleting = isDeleting && prompt.length === 0;
    const timeout = isFinishedTyping ? 1800 : isDeleting ? 28 : 52;

    const timer = window.setTimeout(() => {
      if (isFinishedTyping) {
        setIsDeleting(true);
        return;
      }

      if (isFinishedDeleting) {
        setIsDeleting(false);
        setPromptIndex((currentIndex) => (currentIndex + 1) % heroPrompts.length);
        return;
      }

      setPrompt((currentPrompt) =>
        isDeleting ? currentPrompt.slice(0, -1) : activePrompt.slice(0, currentPrompt.length + 1)
      );
    }, timeout);

    return () => window.clearTimeout(timer);
  }, [isDeleting, isEditing, prompt, promptIndex]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(getBuilderHref(prompt.trim()));
  }

  return (
    <div className="relative mt-8 hidden lg:block">
      <div className="prompt-glow pointer-events-none absolute left-[15%] top-1 h-28 w-[70%]" />
      <form
        onSubmit={handleSubmit}
        className="relative border border-white/30 bg-black p-3 shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
      >
        <label htmlFor="hero-workflow-prompt" className="sr-only">
          Describe the trading workflow you want to create
        </label>
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center border border-white/20 text-white/75">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] tracking-[0.12em] text-white/45">TRY A WORKFLOW</p>
            <div className="mt-1 flex min-w-0 items-center">
              <input
                id="hero-workflow-prompt"
                value={prompt}
                onChange={(event) => {
                  setIsEditing(true);
                  setPrompt(event.target.value);
                }}
                onFocus={() => setIsEditing(true)}
                className="min-h-7 min-w-0 flex-1 border-0 bg-transparent text-lg tracking-[-0.045em] text-white placeholder:text-white/35 focus-visible:outline-none"
                placeholder="Describe a trading rule..."
                autoComplete="off"
              />
              {!isEditing ? (
                <span className="typewriter-caret ml-0.5 h-5 w-px bg-white/80" aria-hidden="true" />
              ) : null}
            </div>
          </div>
          <button
            type="submit"
            className="flex min-h-12 shrink-0 items-center gap-2 border border-white/80 bg-[#f7f7f2] px-5 font-mono text-[10px] font-bold tracking-[0.08em] text-black transition-colors hover:border-[#05fea2] hover:bg-[#05fea2] focus-visible:ring-2 focus-visible:ring-[#05fea2] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            BUILD FLOW <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
