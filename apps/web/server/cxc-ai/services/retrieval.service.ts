import type { AiChatSource } from "@/server/http/contracts";
import { searchInternalContext } from "@/server/search/search.service";
import { fetchWebContext } from "@/server/cxc-ai/services/web-context.service";

type RetrievePublicSourcesArgs = {
  query: string;
  tags?: string[];
  limit?: number;
  includeWeb?: boolean;
};

/**
 * Pulls source-labeled context for a CXC AI turn.
 *
 * Internal retrieval is restricted to public `Question`/`Answer` records via
 * `searchInternalContext`. Optional web context is opt-in (driven by
 * `WEB_CONTEXT_ENDPOINT`) and is appended after internal results so internal
 * sources are preferred during prompt assembly.
 */
export async function retrievePublicQuestionAnswerSources({
  query,
  tags = [],
  limit = 6,
  includeWeb = true,
}: RetrievePublicSourcesArgs): Promise<AiChatSource[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const internal = await safeInternal(trimmed, tags, limit);
  if (!includeWeb) {
    return rank(internal, trimmed).slice(0, limit);
  }

  const remaining = Math.max(0, limit - internal.length);
  const web =
    remaining > 0 ? await safeWeb(trimmed, remaining) : [];

  return rank([...internal, ...web], trimmed).slice(0, limit);
}

async function safeInternal(
  query: string,
  tags: string[],
  limit: number,
): Promise<AiChatSource[]> {
  try {
    return await searchInternalContext(query, { limit, tags });
  } catch {
    return [];
  }
}

async function safeWeb(query: string, limit: number): Promise<AiChatSource[]> {
  try {
    return await fetchWebContext(query, { limit });
  } catch {
    return [];
  }
}

function rank(sources: AiChatSource[], query: string): AiChatSource[] {
  const queryTerms = tokenize(query);

  return sources
    .map((source) => ({
      source,
      score: scoreSource(source, queryTerms),
    }))
    .sort((first, second) => second.score - first.score)
    .map(({ source }) => source);
}

function scoreSource(source: AiChatSource, queryTerms: string[]): number {
  const title = source.title.toLowerCase();
  const snippet = source.snippet.toLowerCase();
  let score = 0;

  for (const term of queryTerms) {
    if (title.includes(term)) {
      score += 2;
    } else if (snippet.includes(term)) {
      score += 1;
    }
  }

  if (source.kind === "question") {
    score += 0.4;
  } else if (source.kind === "answer") {
    score += 0.25;
  }

  return score;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length > 2)
    .slice(0, 12);
}
