import type {
  AiChatSource,
  QuestionSummaryDto,
} from "@/server/http/contracts";
import { toSummaryDto } from "@/server/questions/questions.mappers";
import {
  findInternalContext,
  findMatchingQuestions,
} from "@/server/search/search.queries";
import type { SearchOptions } from "@/server/search/search.types";

/**
 * Postgres-backed search exposed at `GET /api/search`.
 *
 * Returns ranked question summaries — title/tag matches outrank body-only
 * matches (ranking happens inside `searchQuestionRecords`). The optional
 * `tag` filter narrows results to questions carrying that tag slug.
 */
export async function search(
  query: string,
  options: SearchOptions = {},
): Promise<QuestionSummaryDto[]> {
  const records = await findMatchingQuestions({
    query,
    tag: options.tag,
    limit: options.limit,
  });

  return records.map(toSummaryDto);
}

/**
 * Used by CXC AI retrieval to return capped, source-labeled rows scoped to
 * public Question/Answer records. Wraps the db-level helper and shapes rows
 * into `AiChatSource` DTOs.
 */
export async function searchInternalContext(
  query: string,
  options: { limit?: number; tags?: string[] } = {},
): Promise<AiChatSource[]> {
  const rows = await findInternalContext(query, {
    limit: options.limit ?? 6,
    tags: options.tags,
  });

  return rows.map((row): AiChatSource => ({
    id: `${row.kind}:${row.refId}`,
    kind: row.kind,
    label: row.kind === "answer" ? "Answer" : "Question",
    title: row.title,
    snippet: row.snippet,
    questionId: row.questionId,
    answerId: row.answerId,
    url: row.url,
  }));
}

