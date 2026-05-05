import { Fragment, type ReactNode } from "react";

/**
 * Tiny safe markdown renderer for question and answer bodies. Handles the
 * subset visible in the canonical image: numbered/bulleted lists, paragraphs,
 * bare http(s) links, **bold**, *italic*, `code`, fenced code blocks,
 * pipe tables, and blockquotes. Renders plain React nodes — no
 * `dangerouslySetInnerHTML`, no third-party deps.
 */
export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-[var(--color-ink-900)]">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "code"; language: string; content: string }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };

const ORDERED_LINE = /^(\d+)\.\s+(.*)$/;
const UNORDERED_LINE = /^[-*]\s+(.*)$/;
const FENCE_LINE = /^```(\S*)\s*$/;
const BLOCKQUOTE_LINE = /^>\s?(.*)$/;
const TABLE_DIVIDER_LINE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/;

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    const fenceMatch = line.match(FENCE_LINE);
    if (fenceMatch) {
      const language = fenceMatch[1] ?? "";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (FENCE_LINE.test(next)) {
          i += 1;
          break;
        }
        codeLines.push(next);
        i += 1;
      }
      blocks.push({
        kind: "code",
        language,
        content: codeLines.join("\n"),
      });
      continue;
    }

    if (BLOCKQUOTE_LINE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const next = lines[i] ?? "";
        const m = next.match(BLOCKQUOTE_LINE);
        if (!m) break;
        quoteLines.push(m[1] ?? "");
        i += 1;
      }
      blocks.push({ kind: "blockquote", lines: quoteLines });
      continue;
    }

    if (isTableHeaderCandidate(line, lines[i + 1] ?? "")) {
      const header = splitTableRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        if (next.trim() === "" || !next.includes("|")) break;
        rows.push(splitTableRow(next));
        i += 1;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    const orderedMatch = line.match(ORDERED_LINE);
    if (orderedMatch && orderedMatch[2] !== undefined) {
      const items: string[] = [orderedMatch[2]];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        const m = next.match(ORDERED_LINE);
        if (m && m[2] !== undefined) {
          items.push(m[2]);
          i += 1;
          continue;
        }
        if (next.trim() === "") {
          break;
        }
        appendToLast(items, ` ${next.trim()}`);
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    const unorderedMatch = line.match(UNORDERED_LINE);
    if (unorderedMatch && unorderedMatch[1] !== undefined) {
      const items: string[] = [unorderedMatch[1]];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        const m = next.match(UNORDERED_LINE);
        if (m && m[1] !== undefined) {
          items.push(m[1]);
          i += 1;
          continue;
        }
        if (next.trim() === "") {
          break;
        }
        appendToLast(items, ` ${next.trim()}`);
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i] ?? "";
      if (next.trim() === "") break;
      if (ORDERED_LINE.test(next) || UNORDERED_LINE.test(next)) break;
      if (FENCE_LINE.test(next)) break;
      if (BLOCKQUOTE_LINE.test(next)) break;
      if (isTableHeaderCandidate(next, lines[i + 1] ?? "")) break;
      para.push(next);
      i += 1;
    }
    blocks.push({ kind: "p", lines: para });
  }

  return blocks;
}

function isTableHeaderCandidate(
  headerLine: string,
  dividerLine: string,
): boolean {
  if (!headerLine.includes("|")) return false;
  if (!TABLE_DIVIDER_LINE.test(dividerLine)) return false;
  const headerCells = splitTableRow(headerLine);
  const dividerCells = splitTableRow(dividerLine);
  if (headerCells.length === 0) return false;
  if (headerCells.length !== dividerCells.length) return false;
  return true;
}

function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function appendToLast(items: string[], suffix: string) {
  const last = items[items.length - 1];
  if (last !== undefined) {
    items[items.length - 1] = last + suffix;
  }
}

function renderBlock(block: Block, index: number): ReactNode {
  if (block.kind === "p") {
    const text = block.lines.join("\n");
    return (
      <p key={index} className="whitespace-pre-line">
        {renderInline(text)}
      </p>
    );
  }
  if (block.kind === "ol") {
    return (
      <ol
        key={index}
        className="list-decimal space-y-1 pl-6 marker:font-medium marker:text-[var(--color-ink-700)]"
      >
        {block.items.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ol>
    );
  }
  if (block.kind === "ul") {
    return (
      <ul
        key={index}
        className="list-disc space-y-1 pl-6 marker:text-[var(--color-ink-500)]"
      >
        {block.items.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (block.kind === "code") {
    const codeClass = block.language ? `language-${block.language}` : undefined;
    return (
      <pre
        key={index}
        className="my-3 overflow-x-auto rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-4 py-3 font-mono text-sm"
      >
        <code className={codeClass}>{block.content}</code>
      </pre>
    );
  }
  if (block.kind === "blockquote") {
    const text = block.lines.join("\n");
    return (
      <blockquote
        key={index}
        className="my-3 border-l-2 border-[var(--color-cardinal-500)] pl-4 whitespace-pre-line text-[var(--color-ink-700)] italic"
      >
        {renderInline(text)}
      </blockquote>
    );
  }
  return (
    <div
      key={index}
      className="my-3 overflow-x-auto rounded-md border border-[var(--color-border-default)]"
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--color-ink-50)] font-semibold">
            {block.header.map((cell, i) => (
              <th
                key={i}
                className="border border-[var(--color-border-default)] px-3 py-2 text-left"
                scope="col"
              >
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="even:bg-[var(--color-surface-sunk)]">
              {block.header.map((_, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-[var(--color-border-default)] px-3 py-2"
                >
                  {renderInline(row[cellIndex] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const URL_RE = /\bhttps?:\/\/[^\s)<>"']+/g;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_RE = /\*\*([^*]+)\*\*/g;
const ITALIC_RE = /(^|[^*])\*([^*\n]+)\*(?!\*)/g;
const CODE_RE = /`([^`\n]+)`/g;

type Token =
  | { type: "text"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string };

type Match = { start: number; end: number; token: Token };

function tokenize(input: string): Token[] {
  const matches: Match[] = [];

  for (const m of input.matchAll(MD_LINK_RE)) {
    const text = m[1];
    const href = m[2];
    if (text === undefined || href === undefined) continue;
    const start = m.index ?? 0;
    matches.push({
      start,
      end: start + m[0].length,
      token: { type: "link", text, href },
    });
  }
  for (const m of input.matchAll(URL_RE)) {
    const text = m[0];
    const start = m.index ?? 0;
    const end = start + text.length;
    if (overlaps(matches, start, end)) continue;
    matches.push({ start, end, token: { type: "link", text, href: text } });
  }
  for (const m of input.matchAll(BOLD_RE)) {
    const text = m[1];
    if (text === undefined) continue;
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (overlaps(matches, start, end)) continue;
    matches.push({ start, end, token: { type: "bold", text } });
  }
  for (const m of input.matchAll(CODE_RE)) {
    const text = m[1];
    if (text === undefined) continue;
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (overlaps(matches, start, end)) continue;
    matches.push({ start, end, token: { type: "code", text } });
  }
  for (const m of input.matchAll(ITALIC_RE)) {
    const lead = m[1] ?? "";
    const text = m[2];
    if (text === undefined) continue;
    const start = (m.index ?? 0) + lead.length;
    const end = start + m[0].length - lead.length;
    if (overlaps(matches, start, end)) continue;
    matches.push({ start, end, token: { type: "italic", text } });
  }

  matches.sort((a, b) => a.start - b.start);

  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    if (match.start > cursor) {
      tokens.push({ type: "text", text: input.slice(cursor, match.start) });
    }
    tokens.push(match.token);
    cursor = match.end;
  }
  if (cursor < input.length) {
    tokens.push({ type: "text", text: input.slice(cursor) });
  }
  return tokens;
}

function overlaps(matches: Match[], start: number, end: number): boolean {
  return matches.some((m) => start < m.end && end > m.start);
}

function renderInline(input: string): ReactNode {
  const tokens = tokenize(input);
  return (
    <>
      {tokens.map((token, i) => {
        if (token.type === "link") {
          return (
            <a
              key={i}
              href={token.href}
              rel="noreferrer noopener"
              target="_blank"
              className="text-[var(--color-link)] underline decoration-[var(--color-link)]/40 underline-offset-2 transition-colors hover:text-[var(--color-link-hover)] hover:decoration-[var(--color-link-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
            >
              {token.text}
            </a>
          );
        }
        if (token.type === "bold") {
          return (
            <strong
              key={i}
              className="font-semibold text-[var(--color-ink-900)]"
            >
              {token.text}
            </strong>
          );
        }
        if (token.type === "italic") {
          return (
            <em key={i} className="italic">
              {token.text}
            </em>
          );
        }
        if (token.type === "code") {
          return (
            <code
              key={i}
              className="rounded-sm border border-[var(--color-border-default)] bg-[var(--color-ink-50)] px-1 py-0.5 font-mono text-[0.9em] text-[var(--color-ink-900)]"
            >
              {token.text}
            </code>
          );
        }
        return <Fragment key={i}>{token.text}</Fragment>;
      })}
    </>
  );
}

export default Markdown;
