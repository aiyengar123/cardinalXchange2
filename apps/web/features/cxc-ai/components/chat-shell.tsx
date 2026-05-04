"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { MessageComposer } from "@/features/cxc-ai/components/message-composer";
import { MessageList } from "@/features/cxc-ai/components/message-list";
import { useCxcChat } from "@/features/cxc-ai/hooks/use-cxc-chat";
import type { CxcMessageDto } from "@/server/http/contracts";

type ChatShellProps = {
  chatId: string;
  initialMessages: CxcMessageDto[];
  /** When true, on first send the URL replaces to `/cxc-ai/[chatId]`. */
  isNewChat?: boolean;
};

/**
 * Composes the CXC AI chat surface: header strip + scrollable message list +
 * sticky composer. Streaming, persistence, and tool plumbing live in
 * `useCxcChat`; this component is just composition.
 */
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

  // Auto-scroll to the latest message as new content streams in.
  const tailRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Replace the URL once the first user message is sent in a new-chat session
  // so a refresh resumes via `/cxc-ai/[chatId]`.
  const replacedRef = useRef(false);
  useEffect(() => {
    if (!isNewChat || replacedRef.current) return;
    if (messages.some((message) => message.role === "user")) {
      replacedRef.current = true;
      router.replace(`/cxc-ai/${encodeURIComponent(chatId)}`);
    }
  }, [chatId, isNewChat, messages, router]);

  return (
    <div className="flex w-full flex-col gap-4 px-6 py-6 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border-default)] pb-4">
        <div className="min-w-0">
          <h1
            className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-4xl"
            style={{ borderRadius: "var(--radius-title)" }}
          >
            CXC AI
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Answers grounded in public CardinalXchange questions and answers.
          </p>
        </div>
        <Link
          className="inline-flex h-9 items-center justify-center border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-xs font-semibold text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          href="/cxc-ai"
        >
          New chat
        </Link>
      </header>

      <section
        aria-label="Conversation"
        className="flex min-h-[40rem] flex-col gap-4 border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-4 py-5 sm:px-6"
      >
        <MessageList isStreaming={isBusy} messages={messages} />
        <div ref={tailRef} />
      </section>

      {error ? (
        <div
          className="border border-[var(--color-state-danger)] bg-[var(--color-surface-base)] px-3 py-2 text-sm font-medium text-[var(--color-state-danger)]"
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

      <MessageComposer
        busy={isBusy}
        onSend={(text) => {
          void sendMessage({ text });
        }}
        onStop={() => stop()}
      />
    </div>
  );
}

export default ChatShell;
