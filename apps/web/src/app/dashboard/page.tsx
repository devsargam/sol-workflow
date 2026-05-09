"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

export default function DashboardPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    []
  );
  const hasMessages = messages.length > 0;

  const submitMessage = (message: PromptInputMessage) => {
    const text = message.text.trim();

    if (!text) return;

    setMessages([
      { role: "user", content: text },
      {
        role: "assistant",
        content:
          "I can turn that into a workflow draft. Start with the trigger, add any checks, then choose where the action should go.",
      },
    ]);
  };

  return (
    <div className="flex min-h-[calc(100svh-3rem)] flex-1 flex-col bg-[#f8f8f6] text-[#171717] dark:bg-[#070707] dark:text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div
          className={
            hasMessages
              ? "flex flex-1 flex-col"
              : "flex flex-1 flex-col items-center justify-center gap-8"
          }
        >
          {!hasMessages ? (
            <div className="w-full max-w-3xl text-center">
              <h1 className="text-3xl font-normal tracking-normal sm:text-5xl">
                Imagine a workflow
              </h1>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end space-y-5 py-6">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-[82%] rounded-3xl bg-[#303030] px-4 py-3 text-sm leading-6 text-white dark:bg-white dark:text-black"
                        : "max-w-[82%] rounded-3xl border border-black/8 bg-white px-4 py-3 text-sm leading-6 text-black/72 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72"
                    }
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={`mx-auto w-full max-w-3xl ${hasMessages ? "mt-6" : ""}`}>
            <PromptInput
              className="**:data-[slot=input-group]:h-auto **:data-[slot=input-group]:min-h-12 **:data-[slot=input-group]:items-center **:data-[slot=input-group]:rounded-[2rem] **:data-[slot=input-group]:border-black/8 **:data-[slot=input-group]:bg-white **:data-[slot=input-group]:px-3 **:data-[slot=input-group]:py-2 **:data-[slot=input-group]:shadow-[0_18px_60px_rgba(0,0,0,0.08)] dark:**:data-[slot=input-group]:border-white/8 dark:**:data-[slot=input-group]:bg-[#232323] dark:**:data-[slot=input-group]:shadow-none"
              onSubmit={submitMessage}
            >
              <PromptInputBody>
                <PromptInputTextarea
                  className="max-h-40 min-h-9 border-0 bg-transparent px-4 py-1.5 text-lg leading-6 text-black shadow-none placeholder:text-black/40 focus-visible:ring-0 dark:text-white dark:placeholder:text-white/44"
                  placeholder="Imagine a workflow"
                />
              </PromptInputBody>

              <PromptInputSubmit className="size-8 shrink-0 self-center rounded-full bg-[#078c5a] text-white hover:bg-[#067a4f] dark:bg-white dark:text-black dark:hover:bg-white/90">
                <ArrowUp className="size-5" />
              </PromptInputSubmit>
            </PromptInput>
          </div>
        </div>
      </section>
    </div>
  );
}
