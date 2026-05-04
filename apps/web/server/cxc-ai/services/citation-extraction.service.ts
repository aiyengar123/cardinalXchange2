/**
 * Citation token extraction utilities.
 *
 * Tokens look like `[H1]`, `[H1, H4]`, `[H4-H6]`, or `[H1, H4-H6, H8]`.
 * - Letter must be uppercase `H`.
 * - Numbers are 1-indexed.
 * - Whitespace is allowed inside the brackets.
 *
 * These helpers are pure: no I/O, no side effects, no DB writes.
 */

export type CitationRange = {
  start: number;
  end: number;
  ids: number[];
};

// Matches a full citation token, e.g. "[H1, H4-H6]". The `H` letter is required
// before the first number; subsequent entries may omit it (e.g. "[H1, 2]"), but
// the canonical form keeps `H` on every entry. Whitespace is permitted inside.
const CITATION_TOKEN_PATTERN =
  /\[H\s*\d+\s*(?:-\s*\d+\s*)?(?:,\s*H?\s*\d+\s*(?:-\s*\d+\s*)?)*\]/g;

// Matches a single entry within an already-extracted token's inner content,
// e.g. `H1`, `H4-H6`, or (lenient) `4-6`. Used by `parseCitationToken` and
// during range extraction to read ids out of the inner text.
const CITATION_ENTRY_PATTERN = /H?\s*(\d+)\s*(?:-\s*(\d+))?/g;

function parseInner(inner: string): number[] {
  const ids: number[] = [];
  for (const match of inner.matchAll(CITATION_ENTRY_PATTERN)) {
    const startRaw = match[1];
    const endRaw = match[2];
    if (startRaw === undefined) continue;
    const start = Number.parseInt(startRaw, 10);
    if (!Number.isFinite(start) || start < 1) continue;
    if (endRaw === undefined) {
      ids.push(start);
      continue;
    }
    const end = Number.parseInt(endRaw, 10);
    if (!Number.isFinite(end) || end < start) {
      // Malformed range (e.g. `H6-H4`); fall back to the start id only.
      ids.push(start);
      continue;
    }
    for (let n = start; n <= end; n += 1) {
      ids.push(n);
    }
  }
  return ids;
}

/**
 * Parse a full citation token (including the surrounding brackets) into a
 * flat list of 1-indexed source numbers. Returns `[]` for invalid input.
 */
export function parseCitationToken(raw: string): number[] {
  if (typeof raw !== "string" || raw.length < 4) return [];
  if (!raw.startsWith("[") || !raw.endsWith("]")) return [];
  // Validate the whole token shape against the master pattern. Reset lastIndex
  // because `matchAll` / `test` on a `g` regex is stateful.
  CITATION_TOKEN_PATTERN.lastIndex = 0;
  const fullMatch = CITATION_TOKEN_PATTERN.exec(raw);
  CITATION_TOKEN_PATTERN.lastIndex = 0;
  if (!fullMatch || fullMatch[0] !== raw) return [];
  const inner = raw.slice(1, -1);
  return parseInner(inner);
}

/**
 * Find every citation token in `text` and return its byte-offset range plus
 * parsed ids, in source order, non-overlapping.
 */
export function extractCitationRanges(text: string): CitationRange[] {
  if (typeof text !== "string" || text.length === 0) return [];
  const ranges: CitationRange[] = [];
  CITATION_TOKEN_PATTERN.lastIndex = 0;
  for (const match of text.matchAll(CITATION_TOKEN_PATTERN)) {
    const start = match.index;
    if (start === undefined) continue;
    const end = start + match[0].length;
    const inner = match[0].slice(1, -1);
    const ids = parseInner(inner);
    if (ids.length === 0) continue;
    ranges.push({ start, end, ids });
  }
  return ranges;
}

/**
 * Return the unique set of 1-indexed source numbers cited anywhere in `text`.
 */
export function citedSourceIndices(text: string): Set<number> {
  const indices = new Set<number>();
  for (const range of extractCitationRanges(text)) {
    for (const id of range.ids) {
      indices.add(id);
    }
  }
  return indices;
}
