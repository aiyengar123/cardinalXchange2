"use client";

import Link from "next/link";
import { useMemo } from "react";

import { SourcePill } from "@/features/cxc-ai/components/source-pill";
import type { CxcMessageDto, CxcSourceDto } from "@/server/http/contracts";

type MessageListProps = {
  messages: CxcMessageDto[];
  isStreaming?: boolean;
};

/**
 * Renders the full message thread: user bubbles right-aligned, assistant
 * bubbles left-aligned. Assistant messages may include source pills
 * (rendered before text) and an inline `Ask the Community` draft card whose
 * "Use this draft" CTA routes to `/ask?draft=…` carrying transient state
 * (no DB write).
 */
export function MessageList({ messages, isStreaming }: MessageListProps) {
  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul aria-live="polite" className="flex flex-col gap-6">
      {messages.map((message) => (
        <li key={message.id}>
          <MessageBubble isStreaming={isStreaming} message={message} />
        </li>
      ))}
    </ul>
  );
}

function MessageBubble({
  isStreaming,
  message,
}: {
  isStreaming?: boolean;
  message: CxcMessageDto;
}) {
  const isUser = message.role === "user";
  const sources = useMemo(() => extractSources(message), [message]);
  const drafts = useMemo(() => extractDrafts(message), [message]);
  const hasText = message.parts.some((part) => part.type === "text");

  return (
    <article
      className={isUser ? "flex justify-end" : "flex justify-start"}
      data-role={message.role}
    >
      <div
        className={`flex max-w-[min(42rem,90%)] flex-col gap-3 border px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "border-[var(--color-cardinal-500)] bg-[var(--color-cardinal-500)] text-white"
            : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-ink-900)]"
        }`}
      >
        {sources.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <SourcePill key={source.id} source={source} />
            ))}
          </div>
        ) : null}

        {message.parts.map((part, index) => (
          <MessagePart key={`${message.id}-${index}`} part={part} />
        ))}

        {drafts.map((draft, index) => (
          <AskCommunityDraftCard
            draft={draft}
            key={`${message.id}-draft-${index}`}
          />
        ))}

        {!isUser && !hasText && message.parts.length === 0 && isStreaming ? (
          <span className="text-sm text-[var(--color-ink-500)]">Thinking…</span>
        ) : null}
      </div>
    </article>
  );
}

type MessagePart = CxcMessageDto["parts"][number];

function MessagePart({ part }: { part: MessagePart }) {
  if (part.type === "text") {
    return (
      <p className="whitespace-pre-wrap break-words">
        {(part as { text: string }).text}
      </p>
    );
  }

  // Source URL parts are surfaced as pills above; skip rendering them
  // inline. Tool plumbing parts (drafts, search results) are rendered as
  // dedicated cards elsewhere — suppressing them here keeps the message
  // body free of AI slop.
  return null;
}

function AskCommunityDraftCard({
  draft,
}: {
  draft: { title: string; body: string; tags: string[] };
}) {
  const encoded = useMemo(() => encodeURIComponent(JSON.stringify(draft)), [draft]);

  return (
    <aside className="border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
        Ask the Community draft
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-ink-900)]">
        {draft.title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-700)]">
        {draft.body}
      </p>
      {draft.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {draft.tags.map((tag) => (
            <span
              className="inline-flex items-center border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2 py-0.5 text-xs font-medium leading-none text-[var(--color-ink-700)]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Link
          className="inline-flex h-9 items-center justify-center border border-transparent bg-[var(--color-cardinal-500)] px-3 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
          href={`/ask?draft=${encoded}`}
        >
          Use this draft
        </Link>
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[20rem] items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-base font-medium text-[var(--color-ink-900)]">
          Ask anything about Stanford.
        </p>
        <p className="mt-2 text-sm text-[var(--color-ink-500)]">
          CXC AI cites public Q&A when it can.
        </p>
      </div>
    </div>
  );
}

function extractSources(message: CxcMessageDto): CxcSourceDto[] {
  const sources: CxcSourceDto[] = [];
  for (const part of message.parts) {
    if (!part.type.startsWith("source-")) continue;
    const candidate = part as Record<string, unknown>;
    const id =
      (candidate.sourceId as string | undefined) ??
      (candidate.id as string | undefined) ??
      "";
    const url = (candidate.url as string | undefined) ?? "";
    const titleField =
      (candidate.title as string | undefined) ??
      (candidate.name as string | undefined) ??
      "Source";
    const { label, title } = splitLabelTitle(titleField);
    sources.push({
      id: id || `${label}-${title}-${sources.length}`,
      kind: kindForLabel(label),
      label,
      title,
      snippet: "",
      questionId: (candidate.questionId as string | undefined) ?? "",
      answerId: candidate.answerId as string | undefined,
      url,
    });
  }
  return sources;
}

function extractDrafts(
  message: CxcMessageDto,
): { title: string; body: string; tags: string[] }[] {
  const drafts: { title: string; body: string; tags: string[] }[] = [];
  for (const part of message.parts) {
    if (!part.type.startsWith("tool-")) continue;
    if (!part.type.includes("ask_community_draft")) continue;
    const candidate = part as Record<string, unknown>;
    const output =
      (candidate.output as Record<string, unknown> | undefined) ??
      (candidate.result as Record<string, unknown> | undefined) ??
      (candidate.input as Record<string, unknown> | undefined) ??
      null;
    if (!output) continue;
    const title = typeof output.title === "string" ? output.title : "";
    const body = typeof output.body === "string" ? output.body : "";
    const tags = Array.isArray(output.tags)
      ? (output.tags as unknown[]).filter((value): value is string => typeof value === "string")
      : [];
    if (!title && !body) continue;
    drafts.push({ title, body, tags });
  }
  return drafts;
}

function splitLabelTitle(label: string): { label: string; title: string } {
  const colonIndex = label.indexOf(":");
  if (colonIndex > 0 && colonIndex < 6) {
    return {
      label: label.slice(0, colonIndex).trim() || "Source",
      title: label.slice(colonIndex + 1).trim() || label,
    };
  }
  return { label: "Source", title: label };
}

function kindForLabel(label: string): CxcSourceDto["kind"] {
  const upper = label.toUpperCase();
  if (upper === "Q") return "question";
  if (upper === "A") return "answer";
  return "web";
}

export default MessageList;
