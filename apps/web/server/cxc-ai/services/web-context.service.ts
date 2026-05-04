import type { AiChatSource } from "@/server/http/contracts";

type WebContextItem = {
  id?: string;
  title?: string;
  url?: string;
  snippet?: string;
};

type WebContextResponse = {
  results?: WebContextItem[];
};

type FetchWebContextOptions = {
  limit?: number;
};

/**
 * Optional, opt-in web search bridge for CXC AI.
 *
 * If `WEB_CONTEXT_ENDPOINT` is unset, this returns an empty array — the
 * agent then operates on internal Q&A context alone. The endpoint contract
 * is intentionally tiny so any provider (Tavily, internal proxy, etc.) can
 * implement it without our knowing.
 */
export async function fetchWebContext(
  query: string,
  options: FetchWebContextOptions = {},
): Promise<AiChatSource[]> {
  const endpoint = process.env.WEB_CONTEXT_ENDPOINT;
  if (!endpoint) {
    return [];
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const limit = clampLimit(options.limit ?? 4);
  const apiKey = process.env.WEB_CONTEXT_API_KEY;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ query: trimmed, limit }),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as WebContextResponse;
  const items = Array.isArray(payload.results) ? payload.results : [];

  return items
    .filter((item): item is WebContextItem & { url: string; title: string } =>
      typeof item.url === "string" &&
      item.url.length > 0 &&
      typeof item.title === "string" &&
      item.title.length > 0,
    )
    .slice(0, limit)
    .map((item, index): AiChatSource => ({
      id: item.id ?? `web:${index}:${hashUrl(item.url)}`,
      kind: "web",
      label: "Web",
      title: item.title,
      snippet: (item.snippet ?? "").trim(),
      questionId: "",
      url: item.url,
    }));
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 4;
  }
  return Math.min(Math.floor(limit), 8);
}

function hashUrl(url: string): string {
  let hash = 0;
  for (let index = 0; index < url.length; index += 1) {
    hash = (hash * 31 + url.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}
