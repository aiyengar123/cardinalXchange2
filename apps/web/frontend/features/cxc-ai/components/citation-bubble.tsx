"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CxcSourceDto } from "@/backend/http/contracts";

type CitationBubbleProps = {
  index: number;
  source: CxcSourceDto;
};

function labelPrefix(kind: CxcSourceDto["kind"]): string {
  if (kind === "question") return "Q";
  if (kind === "answer") return "A";
  return "W";
}

function kindBadge(kind: CxcSourceDto["kind"]): string {
  if (kind === "question") return "Q";
  if (kind === "answer") return "A";
  return "Web";
}

export function CitationBubble({ index, source }: CitationBubbleProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 150);
  }, [clearCloseTimer]);

  const openNow = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const label = `${labelPrefix(source.kind)}${index}`;
  const isWeb = source.kind === "web";
  const snippet =
    source.snippet.trim().length > 0 ? source.snippet : "No preview available.";
  const target =
    isWeb && source.url && source.url.length > 0
      ? source.url
      : `/questions/${source.questionId}`;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
    >
      <button
        aria-expanded={open}
        aria-label={`Source ${label}: ${source.title}`}
        className="inline-flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-1.5 py-0 align-baseline text-[11px] leading-[1.4] font-semibold text-[var(--color-cardinal-500)] hover:border-[var(--color-cardinal-500)] hover:bg-[var(--color-cardinal-500)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
        onBlur={scheduleClose}
        onClick={() => setOpen((prev) => !prev)}
        onFocus={openNow}
        type="button"
      >
        {label}
        {isWeb ? (
          <span aria-hidden className="ml-0.5">
            ↗
          </span>
        ) : null}
      </button>
      {open ? (
        <span
          className="absolute top-full left-0 z-20 mt-1 w-80 max-w-[22rem] rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-overlay)]"
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
          role="dialog"
        >
          <span className="inline-flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--color-ink-500)] uppercase">
            {kindBadge(source.kind)}
          </span>
          <span className="mt-2 block font-semibold text-[var(--color-ink-900)]">
            {source.title}
          </span>
          <span className="mt-1 [display:-webkit-box] block overflow-hidden text-xs leading-relaxed text-[var(--color-ink-700)] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
            {snippet}
          </span>
          <span className="mt-3 block">
            <a
              className="text-xs font-semibold text-[var(--color-cardinal-500)] underline underline-offset-2 hover:text-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
              href={target}
              onBlur={scheduleClose}
              onFocus={openNow}
              rel={isWeb ? "noreferrer noopener" : undefined}
              target={isWeb ? "_blank" : undefined}
            >
              Open source ↗
            </a>
          </span>
        </span>
      ) : null}
    </span>
  );
}

export default CitationBubble;
