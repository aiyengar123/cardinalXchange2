import type { ReactNode } from "react";

type MarkdownProps = {
  text: string;
  className?: string;
};

type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const URL_PATTERN = /https?:\/\/[^\s<>()]+[^\s<>().,;:!?]/g;
const CODE_PATTERN = /`([^`]+)`/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];

  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: "list", items: listItems });
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);

    if (bulletMatch) {
      flushParagraph();
      listItems.push(bulletMatch[1] ?? "");
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  return blocks;
}

type InlineToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "bold"; value: string }
  | { type: "url"; value: string };

function tokenizeInline(text: string): InlineToken[] {
  const codeTokens: InlineToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(CODE_PATTERN)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      codeTokens.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    codeTokens.push({ type: "code", value: match[1] ?? "" });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) {
    codeTokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  const boldTokens: InlineToken[] = [];
  for (const token of codeTokens) {
    if (token.type !== "text") {
      boldTokens.push(token);
      continue;
    }
    let cursor = 0;
    for (const match of token.value.matchAll(BOLD_PATTERN)) {
      const start = match.index ?? 0;
      if (start > cursor) {
        boldTokens.push({ type: "text", value: token.value.slice(cursor, start) });
      }
      boldTokens.push({ type: "bold", value: match[1] ?? "" });
      cursor = start + match[0].length;
    }
    if (cursor < token.value.length) {
      boldTokens.push({ type: "text", value: token.value.slice(cursor) });
    }
  }

  const finalTokens: InlineToken[] = [];
  for (const token of boldTokens) {
    if (token.type !== "text") {
      finalTokens.push(token);
      continue;
    }
    let cursor = 0;
    for (const match of token.value.matchAll(URL_PATTERN)) {
      const start = match.index ?? 0;
      if (start > cursor) {
        finalTokens.push({
          type: "text",
          value: token.value.slice(cursor, start),
        });
      }
      finalTokens.push({ type: "url", value: match[0] });
      cursor = start + match[0].length;
    }
    if (cursor < token.value.length) {
      finalTokens.push({ type: "text", value: token.value.slice(cursor) });
    }
  }

  return finalTokens;
}

function renderTextWithBreaks(value: string, keyPrefix: string): ReactNode[] {
  const segments = value.split("\n");
  const nodes: ReactNode[] = [];
  segments.forEach((segment, idx) => {
    if (idx > 0) {
      nodes.push(<br key={`${keyPrefix}-br-${idx}`} />);
    }
    if (segment.length > 0) {
      nodes.push(
        <span key={`${keyPrefix}-t-${idx}`}>{segment}</span>,
      );
    }
  });
  return nodes;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens = tokenizeInline(text);
  const nodes: ReactNode[] = [];
  tokens.forEach((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (token.type === "code") {
      nodes.push(
        <code
          className="rounded-sm bg-[var(--color-ink-50)] px-1 py-0.5 font-mono text-[0.85em] text-[var(--color-ink-900)]"
          key={key}
        >
          {token.value}
        </code>,
      );
      return;
    }
    if (token.type === "bold") {
      nodes.push(<strong key={key}>{token.value}</strong>);
      return;
    }
    if (token.type === "url") {
      nodes.push(
        <a
          className="text-[var(--color-cardinal-500)] underline underline-offset-2 hover:text-[var(--color-cardinal-600)]"
          href={token.value}
          key={key}
          rel="noreferrer"
          target="_blank"
        >
          {token.value}
        </a>,
      );
      return;
    }
    nodes.push(...renderTextWithBreaks(token.value, key));
  });
  return nodes;
}

export function Markdown({ text, className }: MarkdownProps) {
  const blocks = parseBlocks(text);

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              className={
                index === 0
                  ? "list-disc space-y-1 pl-5"
                  : "mt-3 list-disc space-y-1 pl-5"
              }
              key={`block-${index}`}
            >
              {block.items.map((item, itemIndex) => (
                <li key={`block-${index}-item-${itemIndex}`}>
                  {renderInline(item, `block-${index}-item-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            className={
              index === 0 ? "leading-relaxed" : "mt-3 leading-relaxed"
            }
            key={`block-${index}`}
          >
            {renderInline(block.text, `block-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

export default Markdown;
