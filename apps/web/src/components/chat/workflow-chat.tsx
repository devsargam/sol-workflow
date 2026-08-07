"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DefaultChatTransport,
  isToolUIPart,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import {
  AnalyticsDownIcon,
  Clock01Icon,
  CoinsSwapIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
import { useWalletAuth } from "@/components/providers/wallet-auth-provider";
import { getPublicApiBaseUrl } from "@/lib/api";
import { getStoredWalletSession } from "@/lib/auth-storage";
import { useChatSession } from "@/lib/hooks/use-chat-sessions";
import { cn } from "@/lib/utils";

const promptRecommendations = [
  {
    title: "Price alert",
    prompt: "If SOL drops below $150, send me a Telegram alert",
    icon: AnalyticsDownIcon,
    iconClassName: "bg-[#9945FF]/12 text-[#9945FF]",
  },
  {
    title: "Wallet watcher",
    prompt: "Notify me when my wallet balance changes by more than 1 SOL",
    icon: Wallet01Icon,
    iconClassName: "bg-[#14F195]/12 text-[#0faf6e] dark:text-[#14F195]",
  },
  {
    title: "Morning digest",
    prompt: "Every day at 9am, send a summary of my wallet activity to Telegram",
    icon: Clock01Icon,
    iconClassName: "bg-[#FFB800]/14 text-[#b78300] dark:text-[#FFB800]",
  },
  {
    title: "Copy trading",
    prompt: "When a wallet I follow swaps tokens, mirror the trade within my limits",
    icon: CoinsSwapIcon,
    iconClassName: "bg-[#29d3ff]/12 text-[#0e9ac4] dark:text-[#29d3ff]",
  },
];

type WorkflowChatProps = {
  chatPath?: string;
  className?: string;
  emptyTitle?: string;
  requireAuthBeforeSend?: boolean;
};

function getChatHref(chatPath: string, chatId: string) {
  const query = `chat=${encodeURIComponent(chatId)}`;
  return chatPath === "/" ? `/?${query}` : `${chatPath}?${query}`;
}

export function WorkflowChatFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[calc(100svh-4rem)] flex-1 flex-col rounded-b-xl bg-[#f8f8f6] text-[#171717] dark:bg-[#070707] dark:text-white",
        className
      )}
    >
      <section className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-black/60 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading chat...</span>
        </div>
      </section>
    </div>
  );
}

export function WorkflowChat({
  chatPath = "/dashboard",
  className,
  emptyTitle = "Imagine a workflow",
  requireAuthBeforeSend = false,
}: WorkflowChatProps) {
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const seededPromptRef = useRef(false);
  const restoredChatRef = useRef<string | null>(null);
  const pendingLoginRequestedRef = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { ready, authenticated, login } = useWalletAuth();
  const chatId = searchParams.get("chat") ?? searchParams.get("id");
  const [newChatId, setNewChatId] = useState(() => crypto.randomUUID());
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const activeChatId = chatId ?? newChatId;
  const selectedChat = useChatSession(chatId);
  const { error, id, messages, sendMessage, setMessages, status } = useChat({
    id: activeChatId,
    transport: new DefaultChatTransport({
      api: `${getPublicApiBaseUrl()}/chat`,
      headers: () => {
        const token = getStoredWalletSession()?.token;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
      },
    }),
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (chatId) {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions", chatId] });
      }
    },
  });
  const hasMessages = messages.length > 0;
  const isRestoringChat =
    Boolean(chatId) &&
    messages.length === 0 &&
    (selectedChat.isLoading ||
      selectedChat.isFetching ||
      (selectedChat.isSuccess && restoredChatRef.current !== chatId));
  const placeholder = promptRecommendations[0]?.prompt;
  const isAwaitingQueuedPrompt = Boolean(pendingPrompt);
  const submitDisabled = isAwaitingQueuedPrompt || status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const awaitingResponse =
    (status === "submitted" || status === "streaming") &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      !lastMessage.parts.some(
        (part) => (part.type === "text" && part.text.length > 0) || isToolUIPart(part)
      ));

  const submitAuthenticatedMessage = useCallback(
    (text: string) => {
      if (!chatId) {
        router.replace(getChatHref(chatPath, id));
      }

      return sendMessage({ text });
    },
    [chatId, chatPath, id, router, sendMessage]
  );

  const requestLoginForPendingPrompt = useCallback(() => {
    pendingLoginRequestedRef.current = true;
    void login();
  }, [login]);

  useEffect(() => {
    if (!chatId) {
      restoredChatRef.current = null;
      setMessages([]);
      setNewChatId(crypto.randomUUID());
    }
  }, [chatId, setMessages]);

  useEffect(() => {
    const session = selectedChat.data?.session;
    if (
      !chatId ||
      !session ||
      session.id !== chatId ||
      restoredChatRef.current === chatId ||
      status !== "ready" ||
      messages.length > 0
    ) {
      return;
    }

    setMessages(session.messages);
    restoredChatRef.current = chatId;
  }, [chatId, messages.length, selectedChat.data?.session, setMessages, status]);

  useEffect(() => {
    if (!requireAuthBeforeSend || !pendingPrompt || !ready) {
      return;
    }

    if (!authenticated) {
      if (!pendingLoginRequestedRef.current) {
        requestLoginForPendingPrompt();
      }
      return;
    }

    if (status !== "ready" || isRestoringChat) {
      return;
    }

    const prompt = pendingPrompt;
    pendingLoginRequestedRef.current = false;
    setPendingPrompt(null);
    void submitAuthenticatedMessage(prompt);
  }, [
    authenticated,
    isRestoringChat,
    pendingPrompt,
    ready,
    requestLoginForPendingPrompt,
    requireAuthBeforeSend,
    status,
    submitAuthenticatedMessage,
  ]);

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

  const seedPrompt = searchParams.get("prompt");

  useEffect(() => {
    if (seededPromptRef.current || !seedPrompt || chatId || hasMessages) {
      return;
    }

    const textarea = promptTextareaRef.current;
    if (!textarea) {
      return;
    }

    seededPromptRef.current = true;
    textarea.focus();
    textarea.value = seedPrompt;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.setSelectionRange(seedPrompt.length, seedPrompt.length);
  }, [chatId, hasMessages, seedPrompt]);

  useEffect(() => {
    if (!hasMessages || isRestoringChat) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      chatBottomRef.current?.scrollIntoView({
        behavior: status === "streaming" ? "auto" : "smooth",
        block: "end",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [error?.message, hasMessages, isRestoringChat, messages, status]);

  const applySuggestion = useCallback((prompt: string) => {
    const textarea = promptTextareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.value = prompt;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.setSelectionRange(prompt.length, prompt.length);
  }, []);

  const submitMessage = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();

      if (!text) return;

      if (requireAuthBeforeSend && (!ready || !authenticated)) {
        pendingLoginRequestedRef.current = false;
        setPendingPrompt(text);

        if (ready) {
          requestLoginForPendingPrompt();
        }

        return;
      }

      return submitAuthenticatedMessage(text);
    },
    [
      authenticated,
      ready,
      requestLoginForPendingPrompt,
      requireAuthBeforeSend,
      submitAuthenticatedMessage,
    ]
  );

  return (
    <div
      className={cn(
        "flex min-h-[calc(100svh-4rem)] flex-1 flex-col rounded-b-xl bg-[#f8f8f6] text-[#171717] dark:bg-[#070707] dark:text-white",
        className
      )}
    >
      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div
          className={
            hasMessages
              ? "flex flex-1 flex-col"
              : "flex flex-1 flex-col items-center justify-center gap-8"
          }
        >
          {isRestoringChat ? (
            <div className="flex w-full max-w-3xl flex-1 items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm text-black/60 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white/70">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading chat...</span>
              </div>
            </div>
          ) : !hasMessages ? (
            <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2 text-center duration-500">
              <h1 className="text-3xl font-normal tracking-normal sm:text-5xl">{emptyTitle}</h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-black/45 sm:text-base dark:text-white/45">
                Describe a trigger, filter, and action — Dolphinflow turns it into a running
                workflow.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-5 py-6">
              {messages.map((message, index) => (
                <ChatMessage key={`${message.role}-${index}`} message={message} />
              ))}
              {awaitingResponse ? <TypingIndicator /> : null}
              {error ? (
                <Message from="assistant" className="max-w-full">
                  <MessageContent className="max-w-[82%] rounded-3xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                    <MessageResponse>{error.message}</MessageResponse>
                  </MessageContent>
                </Message>
              ) : null}
            </div>
          )}

          <div className={cn("mx-auto w-full max-w-3xl", hasMessages && "mt-6")}>
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
                className="size-8 shrink-0 self-center rounded-full bg-[#078c5a] text-white hover:bg-[#067a4f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                disabled={submitDisabled}
                status={pendingPrompt ? "submitted" : status}
              >
                {pendingPrompt ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-5" />
                )}
              </PromptInputSubmit>
            </PromptInput>

            {!hasMessages && !isRestoringChat ? (
              <div className="mt-8">
                <p className="text-center text-xs font-medium tracking-wide text-black/35 uppercase dark:text-white/35">
                  Or start from an idea
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {promptRecommendations.map((recommendation, index) => (
                    <button
                      className="group animate-in fade-in slide-in-from-bottom-3 fill-mode-both flex cursor-pointer items-start gap-3 rounded-2xl border border-black/8 bg-white/80 p-4 text-left shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-white/16 dark:hover:bg-white/[0.08]"
                      key={recommendation.title}
                      onClick={() => applySuggestion(recommendation.prompt)}
                      style={{ animationDelay: `${120 + index * 70}ms` }}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                          recommendation.iconClassName
                        )}
                      >
                        <HugeiconsIcon
                          className="size-4"
                          icon={recommendation.icon}
                          strokeWidth={1.8}
                        />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-medium text-black/85 dark:text-white/90">
                          {recommendation.title}
                        </span>
                        <span className="line-clamp-2 text-xs leading-5 text-black/50 dark:text-white/50">
                          {recommendation.prompt}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div ref={chatBottomRef} className="h-8 shrink-0" aria-hidden="true" />
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
              ? "max-w-[82%] !rounded-3xl bg-white px-4 py-3 text-sm leading-6 text-black shadow-sm ring-1 ring-black/8 [overflow-wrap:anywhere] [&_a]:font-medium [&_a]:!text-black [&_a]:underline [&_a]:decoration-black/70 [&_a]:decoration-1 [&_a]:underline-offset-4 dark:bg-white dark:text-black dark:ring-white/10"
              : "max-w-[82%] rounded-3xl border border-black/8 bg-white px-4 py-3 text-sm leading-6 text-black/72 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/72"
          }
        >
          <div className="flex flex-col gap-3">
            {textParts.map((part, index) =>
              message.role === "user" ? (
                <div
                  className="whitespace-pre-wrap [overflow-wrap:anywhere] [&_a]:font-medium [&_a]:!text-black [&_a]:underline [&_a]:decoration-black [&_a]:underline-offset-4"
                  key={`text-${index}`}
                >
                  {renderUserMessageText(part.text)}
                </div>
              ) : (
                <MessageResponse className="[overflow-wrap:anywhere]" key={`text-${index}`}>
                  {part.text}
                </MessageResponse>
              )
            )}
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

function TypingIndicator() {
  return (
    <Message from="assistant" className="max-w-full gap-3">
      <MessageContent className="max-w-[82%] rounded-3xl border border-black/8 bg-white px-4 py-4 dark:border-white/10 dark:bg-white/[0.06]">
        <div className="flex items-center gap-1.5" aria-label="Assistant is responding" role="status">
          {[0, 1, 2].map((dot) => (
            <span
              className="size-1.5 animate-bounce rounded-full bg-black/35 dark:bg-white/45"
              key={dot}
              style={{ animationDelay: `${dot * 160}ms`, animationDuration: "1s" }}
            />
          ))}
        </div>
      </MessageContent>
    </Message>
  );
}

function renderUserMessageText(text: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    if (!part.match(urlPattern)) {
      return part;
    }

    return (
      <a href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
        {part}
      </a>
    );
  });
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
          output={
            <MessageResponse className="p-2">{formatToolOutput(part.output)}</MessageResponse>
          }
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
