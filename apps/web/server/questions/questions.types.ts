// Server-internal Question types. Wire DTOs that cross to the client live in
// `@/server/http/contracts`. This file is the home for in-server orchestration
// shapes that consumers in `apps/web/server/**` import.

export type FeedSort = "newest" | "active" | "unanswered";

export type ListQuestionsForFeedArgs = {
  tag?: string;
  sort?: FeedSort;
};
