"use client";

import { ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { MessageList } from "@/features/cxc-ai/components/message-list";
import { PromptInput } from "@/features/cxc-ai/components/prompt-input";
import { useCxcChat } from "@/features/cxc-ai/hooks/use-cxc-chat";
import { useStickToBottom } from "@/features/cxc-ai/hooks/use-stick-to-bottom";
import type { CxcMessageDto } from "@/backend/http/contracts";

type ChatShellProps = {
  chatId: string;
  initialMessages: CxcMessageDto[];
  /** When true, on first send the URL replaces to `/cxc-ai/[chatId]`. */
  isNewChat?: boolean;
};

export function ChatShell({
  chatId,
  initialMessages,
  isNewChat = false,
}: ChatShellProps) {
  const router = useRouter();
  const { error, messages, regenerate, sendMessage, status, stop } = useCxcChat(
    {
      chatId,
      initialMessages,
    },
  );
  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const { isAtBottom, scrollToBottom } = useStickToBottom();
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [isAtBottom, messages, scrollToBottom]);

  const replacedRef = useRef(false);
  useEffect(() => {
    if (!isNewChat || replacedRef.current) return;
    if (messages.some((message) => message.role === "user")) {
      replacedRef.current = true;
      router.replace(`/cxc-ai/${encodeURIComponent(chatId)}`);
    }
  }, [chatId, isNewChat, messages, router]);

  const promptStatus = mapStatus(status);

  const handleSend = (text: string) => {
    void sendMessage({ text });
  };

  if (!hasMessages) {
    return (
      <div className="flex min-h-[calc(100vh-68px)] w-full flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-[760px]">
          <h1 className="text-center font-serif text-4xl font-semibold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-5xl">
            How can I help?
          </h1>
          <p className="mt-3 text-center text-sm text-[var(--color-ink-500)]">
            Grounded in public CardinalXchange questions. Always check the source.
          </p>
          <div className="mt-8">
            <PromptInput
              autoFocus
              onSend={handleSend}
              onStop={() => stop()}
              placeholder="Ask anything about Stanford."
              status={promptStatus}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-68px)] w-full flex-col">
      <header className="sticky top-[68px] z-10 border-b border-[var(--color-border-default)] bg-[var(--color-surface-base)] py-3">
        <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-3xl">
          CXC AI
        </h1>
      </header>

      <section
        aria-label="Conversation"
        className="flex flex-1 flex-col gap-6 py-6 pb-32"
      >
        <MessageList isStreaming={isBusy} messages={messages} />
      </section>

      {!isAtBottom ? (
        <button
          aria-label="Scroll to latest"
          className="fixed bottom-32 right-8 z-20 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-ink-700)] shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          onClick={() => scrollToBottom("smooth")}
          type="button"
        >
          <ArrowDown aria-hidden className="h-4 w-4" />
        </button>
      ) : null}

      {error ? (
        <div
          className="sticky bottom-[88px] mx-auto w-full max-w-3xl rounded-md border border-[var(--color-state-danger)] bg-[var(--color-surface-base)] px-3 py-2 text-sm font-medium text-[var(--color-state-danger)]"
          role="alert"
        >
          CXC AI could not finish that response.{" "}
          <button
            className="underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            onClick={() => regenerate()}
            type="button"
          >
            Retry
          </button>
          .
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 border-t border-[var(--color-border-default)] bg-[var(--color-surface-base)] py-3">
        <PromptInput
          onSend={handleSend}
          onStop={() => stop()}
          placeholder="Ask a follow-up…"
          status={promptStatus}
        />
      </div>
    </div>
  );
}

function mapStatus(
  status: ReturnType<typeof useCxcChat>["status"],
): "ready" | "submitted" | "streaming" | "error" {
  if (status === "submitted") return "submitted";
  if (status === "streaming") return "streaming";
  if (status === "error") return "error";
  return "ready";
}

export default ChatShell;
