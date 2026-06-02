// Server-internal Question types. Wire DTOs that cross to the client live in
// `@/backend/http/contracts`. This file is the home for in-server orchestration
// shapes that consumers in `apps/web/backend/**` import.

export type FeedSort = "newest" | "active" | "unanswered" | "answered";

export type ListQuestionsForFeedArgs = {
  tag?: string;
  sort?: FeedSort;
};
