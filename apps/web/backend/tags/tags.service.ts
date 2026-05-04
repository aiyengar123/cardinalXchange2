import { listTagsWithCounts } from "@cardinalxchange/db";

import type { TagListItemDto } from "@/backend/http/contracts";

/**
 * Read-side service for the `/tags` page. Returns every tag with its
 * question count, ordered by count desc then label asc.
 */
export async function listTagsForIndex(): Promise<TagListItemDto[]> {
  const rows = await listTagsWithCounts();
  return rows.map((row) => ({
    slug: row.slug,
    label: row.label,
    questionCount: row.questionCount,
  }));
}
