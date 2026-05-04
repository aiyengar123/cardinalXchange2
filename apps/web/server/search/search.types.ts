// Internal search types. The wire-facing DTOs (`QuestionSummaryDto`) come
// from `@/server/http/contracts`.

export type SearchOptions = {
  tag?: string;
  limit?: number;
};
