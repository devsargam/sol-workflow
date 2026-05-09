"use client";

import { useMemo, useState } from "react";
import { ArrowUp, Bot, Clock3, Paperclip, Plus, Sparkles, Workflow } from "lucide-react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

const suggestions = [
  "Monitor a wallet and alert me on large transfers",
  "Create a workflow for token listing notifications",
  "Watch whale activity and send Telegram updates",
  "Trigger a webhook when an onchain event happens",
];

const quickActions = [
  {
    icon: Workflow,
    label: "Build workflow",
  },
  {
    icon: Clock3,
    label: "Schedule checks",
  },
  {
    icon: Bot,
    label: "Agent actions",
  },
];

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
              : "flex flex-1 flex-col items-center justify-center"
          }
        >
          {!hasMessages ? (
            <div className="w-full max-w-3xl text-center">
              <h1 className="text-3xl font-semibold tracking-normal sm:text-5xl">
                what are we automating?
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-black/58 dark:text-white/58">
                Describe an onchain event, an agent decision, or a notification flow. Dolphinflow
                can help shape it into a workflow.
              </p>

              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-left text-sm leading-5 text-black/72 transition hover:border-black/18 hover:bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72 dark:hover:border-white/18 dark:hover:bg-white/[0.09]"
                    onClick={() => submitMessage({ text: suggestion, files: [] })}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
        </div>

        <div className="mx-auto mt-6 w-full max-w-3xl">
          <PromptInput accept="image/*,.pdf,.txt,.md" multiple onSubmit={submitMessage}>
            <PromptInputBody>
              <PromptInputTextarea
                className="min-h-20 resize-none border-0 bg-transparent px-4 pt-4 text-base shadow-none focus-visible:ring-0"
                placeholder="What workflow do you want to build?"
              />
            </PromptInputBody>

            <PromptInputFooter className="border-t border-black/6 px-3 py-2 dark:border-white/8">
              <PromptInputTools>
                <PromptInputButton tooltip="New workflow">
                  <Plus className="size-4" />
                </PromptInputButton>
                <PromptInputButton tooltip="Attach context">
                  <Paperclip className="size-4" />
                </PromptInputButton>
                {quickActions.map((action) => (
                  <PromptInputButton
                    className="hidden gap-1.5 rounded-full px-2.5 text-xs sm:inline-flex"
                    key={action.label}
                    tooltip={action.label}
                  >
                    <action.icon className="size-3.5" />
                    {action.label}
                  </PromptInputButton>
                ))}
              </PromptInputTools>

              <PromptInputSubmit className="rounded-full bg-[#078c5a] text-white hover:bg-[#067a4f] dark:bg-[#14f195] dark:text-black dark:hover:bg-[#46f5aa]">
                <ArrowUp className="size-4" />
              </PromptInputSubmit>
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>
    </div>
  );
}
