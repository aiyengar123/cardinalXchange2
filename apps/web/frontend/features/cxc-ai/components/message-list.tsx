"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CitationBubble } from "@/features/cxc-ai/components/citation-bubble";
import { CitedText } from "@/features/cxc-ai/components/cited-text";
import { RelatedQuestions } from "@/features/cxc-ai/components/related-questions";
import ToolChain from "@/features/cxc-ai/components/tool-chain";
import { citedSourceIndices } from "@/backend/cxc-ai/services/citation-extraction.service";
import type {
  AskCommunityDraft,
  CxcMessageDto,
  CxcSourceDto,
} from "@/backend/http/contracts";

type MessageListProps = {
  messages: CxcMessageDto[];
  isStreaming?: boolean;
};

export function MessageList({ messages, isStreaming }: MessageListProps) {
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
  const toolParts = useMemo(() => extractToolParts(message), [message]);
  const text = useMemo(() => extractText(message), [message]);
  const hasInlineCitations = useMemo(
    () => citedSourceIndices(text).size > 0,
    [text],
  );

  if (isUser) {
    return (
      <article className="flex justify-end" data-role="user">
        <div className="max-w-[min(38rem,85%)] rounded-md bg-[var(--color-cardinal-500)] px-4 py-2.5 text-sm leading-relaxed text-white">
          <p className="break-words whitespace-pre-wrap">{text}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-2" data-role="assistant">
      {toolParts.length > 0 ? <ToolChain parts={toolParts} /> : null}

      {text ? (
        <CitedText
          className="text-sm text-[var(--color-ink-900)] [&_p]:text-sm"
          sources={sources}
          text={text}
        />
      ) : null}

      {sources.length > 0 && hasInlineCitations ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-wide text-[var(--color-ink-500)] uppercase">
            Sources
          </span>
          {sources.map((source, index) => (
            <CitationBubble index={index + 1} key={source.id} source={source} />
          ))}
        </div>
      ) : null}

      {sources.length > 0 && !hasInlineCitations ? (
        <RelatedQuestions sources={sources} />
      ) : null}

      {drafts.map((draft, index) => (
        <AskCommunityDraftCard
          draft={draft}
          key={`${message.id}-draft-${index}`}
        />
      ))}

      {!text &&
      toolParts.length === 0 &&
      sources.length === 0 &&
      drafts.length === 0 &&
      isStreaming ? (
        <span className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-500)]">
          <span
            aria-hidden
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-cardinal-500)]"
          />
          Thinking…
        </span>
      ) : null}
    </article>
  );
}

function AskCommunityDraftCard({ draft }: { draft: AskCommunityDraft }) {
  const encoded = useMemo(
    () => encodeURIComponent(JSON.stringify(draft)),
    [draft],
  );

  return (
    <aside className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] p-3">
      <p className="text-[11px] font-semibold tracking-wide text-[var(--color-ink-500)] uppercase">
        Ask the Community draft
      </p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-ink-900)]">
        {draft.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[var(--color-ink-700)]">
        {draft.body}
      </p>
      {draft.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {draft.tags.map((tag) => (
            <span
              className="inline-flex items-center rounded-sm border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2 py-0.5 text-xs leading-none font-medium text-[var(--color-ink-700)]"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Link
          className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-3 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:outline-none"
          href={`/ask?draft=${encoded}`}
        >
          Use this draft
        </Link>
      </div>
    </aside>
  );
}

function extractText(message: CxcMessageDto): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text ?? "")
    .join("");
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
    const meta = readCxcMeta(candidate);
    sources.push({
      id: id || `${label}-${title}-${sources.length}`,
      kind: kindForLabel(label, meta.kind),
      label,
      title,
      snippet: meta.snippet ?? (candidate.snippet as string | undefined) ?? "",
      questionId: (candidate.questionId as string | undefined) ?? "",
      answerId: candidate.answerId as string | undefined,
      url,
    });
  }
  return sources;
}

function readCxcMeta(part: Record<string, unknown>): {
  snippet?: string;
  kind?: string;
} {
  const provider = part.providerMetadata;
  if (typeof provider !== "object" || provider === null) return {};
  const cxc = (provider as Record<string, unknown>).cxc;
  if (typeof cxc !== "object" || cxc === null) return {};
  const record = cxc as Record<string, unknown>;
  return {
    snippet: typeof record.snippet === "string" ? record.snippet : undefined,
    kind: typeof record.kind === "string" ? record.kind : undefined,
  };
}

function extractToolParts(
  message: CxcMessageDto,
): Array<Record<string, unknown>> {
  const result: Array<Record<string, unknown>> = [];
  for (const part of message.parts) {
    if (typeof part.type !== "string") continue;
    if (!part.type.startsWith("tool-")) continue;
    if (part.type === "tool-ask_community_draft") continue;
    result.push(part as unknown as Record<string, unknown>);
  }
  return result;
}

function extractDrafts(message: CxcMessageDto): AskCommunityDraft[] {
  const drafts: AskCommunityDraft[] = [];
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
      ? (output.tags as unknown[]).filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    if (!title && !body) continue;
    drafts.push({ title, body, tags });
  }
  return drafts;
}

function splitLabelTitle(label: string): { label: string; title: string } {
  const colonIndex = label.indexOf(":");
  if (colonIndex > 0 && colonIndex < 10) {
    return {
      label: label.slice(0, colonIndex).trim() || "Source",
      title: label.slice(colonIndex + 1).trim() || label,
    };
  }
  return { label: "Source", title: label };
}

function kindForLabel(label: string, metaKind?: string): CxcSourceDto["kind"] {
  if (metaKind === "question" || metaKind === "answer" || metaKind === "web") {
    return metaKind;
  }
  const lower = label.toLowerCase();
  if (lower.startsWith("question") || lower === "q") return "question";
  if (lower.startsWith("answer") || lower === "a") return "answer";
  return "web";
}

export default MessageList;
