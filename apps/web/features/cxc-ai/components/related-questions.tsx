"use client";

import { ArrowUpRight } from "lucide-react";

import type { CxcSourceDto } from "@/server/http/contracts";

type RelatedQuestionsProps = {
  sources: CxcSourceDto[];
  heading?: string;
  limit?: number;
};

export function RelatedQuestions({
  sources,
  heading = "Related questions",
  limit = 4,
}: RelatedQuestionsProps) {
  if (sources.length === 0) return null;
  const visible = sources.slice(0, limit);

  return (
    <section className="mt-3 flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
        {heading}
      </h3>
      <ul className="flex flex-col gap-2">
        {visible.map((source) => (
          <li key={source.id}>
            <a
              className="group flex items-start gap-3 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 transition-colors duration-150 ease-out hover:border-[var(--color-cardinal-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              href={resolveHref(source)}
              rel="noreferrer"
              target="_blank"
            >
              <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-sm border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-500)]">
                {kindBadge(source.kind)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-semibold text-[var(--color-ink-900)] group-hover:text-[var(--color-cardinal-500)]">
                  {source.title}
                </span>
                {source.snippet ? (
                  <span className="line-clamp-2 text-xs leading-relaxed text-[var(--color-ink-700)]">
                    {source.snippet}
                  </span>
                ) : null}
              </span>
              <ArrowUpRight
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-500)] transition-colors duration-150 ease-out group-hover:text-[var(--color-cardinal-500)]"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function resolveHref(source: CxcSourceDto): string {
  if (source.url && source.url.length > 0) return source.url;
  if (source.questionId) return `/questions/${source.questionId}`;
  return "#";
}

function kindBadge(kind: CxcSourceDto["kind"]): string {
  if (kind === "question") return "Q";
  if (kind === "answer") return "A";
  return "Web";
}

export default RelatedQuestions;
