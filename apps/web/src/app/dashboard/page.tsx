"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { ArrowUp } from "lucide-react";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { getPublicApiBaseUrl } from "@/lib/api";
import { getStoredWalletSession } from "@/lib/auth-storage";

const placeholderSuggestions = [
  "Imagine a workflow",
  "Monitor wallet activity",
  "Send alerts from onchain events",
  "Trigger actions with agents",
];

export default function DashboardPage() {
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${getPublicApiBaseUrl()}/chat`,
      headers: () => {
        const token = getStoredWalletSession()?.token;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
      },
    }),
  });
  const typewriterPlaceholder = useTypewriterPlaceholder(placeholderSuggestions);
  const hasMessages = messages.length > 0;
  const placeholder = hasMessages ? placeholderSuggestions[0] : typewriterPlaceholder;

  useEffect(() => {
    const focusPromptOnTyping = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.length !== 1
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (isEditableTarget || document.querySelector("[data-slot='dialog-content']")) {
        return;
      }

      const textarea = promptTextareaRef.current;
      if (!textarea) {
        return;
      }

      event.preventDefault();
      textarea.focus();

      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
      textarea.setRangeText(event.key, cursorPosition, cursorPosition, "end");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    };

    document.addEventListener("keydown", focusPromptOnTyping);
    return () => document.removeEventListener("keydown", focusPromptOnTyping);
  }, []);

  const submitMessage = (message: PromptInputMessage) => {
    const text = message.text.trim();

    if (!text) return;

    return sendMessage({ text });
  };

  return (
    <div className="flex min-h-[calc(100svh-4rem)] rounded-b-xl flex-1 flex-col bg-[#f8f8f6] text-[#171717] dark:bg-[#070707] dark:text-white">
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
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-5 py-6">
              {messages.map((message, index) => (
                <ChatMessage key={`${message.role}-${index}`} message={message} />
              ))}
              {error ? (
                <Message from="assistant" className="max-w-full">
                  <MessageContent className="max-w-[82%] rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                    <MessageResponse>{error.message}</MessageResponse>
                  </MessageContent>
                </Message>
              ) : null}
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
                  placeholder={placeholder}
                  ref={promptTextareaRef}
                />
              </PromptInputBody>

              <PromptInputSubmit
                className="size-8 shrink-0 self-center rounded-full bg-[#078c5a] text-white hover:bg-[#067a4f] dark:bg-white dark:text-black dark:hover:bg-white/90"
                status={status}
              >
                <ArrowUp className="size-5" />
              </PromptInputSubmit>
            </PromptInput>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ message }: { message: UIMessage }) {
  const textParts = message.parts.filter((part) => part.type === "text");
  const toolParts = message.parts.filter(isToolUIPart);

  return (
    <Message from={message.role} className="max-w-full gap-3">
      {textParts.length > 0 ? (
        <MessageContent
          className={
            message.role === "user"
              ? "max-w-[82%] rounded-3xl bg-[#303030] px-4 py-3 text-sm leading-6 text-white dark:bg-white dark:text-black"
              : "max-w-[82%] rounded-3xl border border-black/8 bg-white px-4 py-3 text-sm leading-6 text-black/72 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72"
          }
        >
          <div className="flex flex-col gap-3">
            {textParts.map((part, index) => (
              <MessageResponse key={`text-${index}`}>{part.text}</MessageResponse>
            ))}
          </div>
        </MessageContent>
      ) : null}

      {toolParts.length > 0 ? (
        <div className="w-full space-y-3">
          {toolParts.map((part, index) => (
            <WorkflowToolPart key={`${part.type}-${index}`} part={part} />
          ))}
        </div>
      ) : null}
    </Message>
  );
}

function WorkflowToolPart({ part }: { part: ToolUIPart<any> | DynamicToolUIPart }) {
  const headerProps =
    part.type === "dynamic-tool"
      ? { type: part.type, state: part.state, toolName: part.toolName }
      : { type: part.type, state: part.state };

  return (
    <Tool defaultOpen={part.state !== "output-available"} className="mb-0 bg-background/60">
      <ToolHeader {...headerProps} />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput
          output={<MessageResponse>{formatToolOutput(part.output)}</MessageResponse>}
          errorText={part.errorText}
        />
      </ToolContent>
    </Tool>
  );
}

function formatToolOutput(output: unknown) {
  if (!output) return "";

  if (typeof output !== "object") {
    return String(output);
  }

  const result = output as {
    created?: boolean;
    valid?: boolean;
    reason?: string;
    errors?: string[];
    workflow?: {
      name?: string;
      id?: string;
      editPath?: string;
    } | null;
    summary?: {
      nodeCount?: number;
      edgeCount?: number;
    };
  };

  if (result.created && result.workflow) {
    return [
      `**Workflow created:** ${result.workflow.name ?? "Untitled workflow"}`,
      result.workflow.id ? `**ID:** ${result.workflow.id}` : null,
      result.workflow.editPath ? `**Edit:** ${result.workflow.editPath}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (result.valid !== undefined) {
    const lines = [`**Validation:** ${result.valid ? "Passed" : "Failed"}`];

    if (result.reason) lines.push(result.reason);
    if (result.errors?.length) {
      lines.push(result.errors.map((error) => `- ${error}`).join("\n"));
    }
    if (result.summary) {
      lines.push(
        `Nodes: ${result.summary.nodeCount ?? 0}, edges: ${result.summary.edgeCount ?? 0}`
      );
    }

    return lines.join("\n\n");
  }

  return `\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\``;
}

function useTypewriterPlaceholder(items: string[]) {
  const first = items[0] ?? "";
  const [text, setText] = useState(first);

  useEffect(() => {
    if (!first) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      setText(first);
      return;
    }

    let itemIndex = 0;
    let charIndex = first.length;
    let deleting = false;
    let timeoutId: number;

    const tick = () => {
      const current = items[itemIndex] ?? first;

      if (deleting) {
        charIndex -= 1;
        setText(current.slice(0, charIndex));

        if (charIndex <= 0) {
          deleting = false;
          itemIndex = (itemIndex + 1) % items.length;
        }
      } else {
        charIndex += 1;
        setText(current.slice(0, charIndex));

        if (charIndex >= current.length) {
          deleting = true;
          timeoutId = window.setTimeout(tick, 1300);
          return;
        }
      }

      timeoutId = window.setTimeout(tick, deleting ? 24 : 38);
    };

    timeoutId = window.setTimeout(tick, 900);

    return () => window.clearTimeout(timeoutId);
  }, [first, items]);

  return text;
}
