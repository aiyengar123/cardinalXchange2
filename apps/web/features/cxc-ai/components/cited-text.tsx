"use client";

import type { ReactNode } from "react";

import { extractCitationRanges } from "@/server/cxc-ai/services/citation-extraction.service";
import type { CxcSourceDto } from "@/server/http/contracts";

import CitationBubble from "./citation-bubble";
import Markdown from "./markdown";

type CitedTextProps = {
  text: string;
  sources: CxcSourceDto[];
  className?: string;
};

/**
 * Drop-in replacement for `<Markdown>` when assistant output may contain
 * `[H#]` citation tokens. Surrounding text is rendered through `<Markdown>`;
 * each citation token becomes an inline group of `<CitationBubble>` chips.
 *
 * The "slab" approach (alternating markdown blocks and chip groups) is a
 * deliberate approximation: in practice the model emits citations at the end
 * of a sentence or paragraph, so the chips visually sit at block boundaries
 * without requiring a rehype-style AST rewrite.
 */
export function CitedText({ text, sources, className }: CitedTextProps) {
  const ranges = extractCitationRanges(text);

  if (ranges.length === 0) {
    return <Markdown className={className} text={text} />;
  }

  const nodes: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach((range, rangeIndex) => {
    if (range.start > cursor) {
      const slab = text.slice(cursor, range.start);
      nodes.push(<Markdown key={`slab-${rangeIndex}`} text={slab} />);
    }

    const chipNodes: ReactNode[] = [];
    range.ids.forEach((id, idIdx) => {
      const source = sources[id - 1];
      if (source === undefined) {
        chipNodes.push(
          <span
            className="text-[var(--color-ink-500)]"
            key={`miss-${rangeIndex}-${idIdx}`}
          >
            [H{id}]
          </span>,
        );
        return;
      }
      chipNodes.push(
        <CitationBubble
          index={id}
          key={`chip-${rangeIndex}-${idIdx}`}
          source={source}
        />,
      );
    });

    nodes.push(
      <span
        className="inline-flex flex-wrap items-center gap-1"
        key={`chips-${rangeIndex}`}
      >
        {chipNodes}
      </span>,
    );

    cursor = range.end;
  });

  if (cursor < text.length) {
    const tail = text.slice(cursor);
    nodes.push(<Markdown key="slab-tail" text={tail} />);
  }

  return <div className={className}>{nodes}</div>;
}
