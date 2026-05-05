# Test Coverage Expansion — Build-2 / Task 07

Expanded the Vitest harness from 22 starter cases to **100 total** tests
across the four workspaces, sitting at the cap defined by the brief.

## Per-area counts

| Area                                 | File(s)                                                                       | Cases                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Backend services — questions         | `apps/web/backend/questions/__tests__/questions.service.test.ts`              | 12 (incl. 2 auth-aware cases owned by the auth workstream) |
| Backend services — answers           | `apps/web/backend/answers/__tests__/answers.service.test.ts`                  | 5                                                          |
| Backend services — tags              | `apps/web/backend/tags/__tests__/tags.service.test.ts`                        | 3                                                          |
| Backend services — search            | `apps/web/backend/search/__tests__/search.service.test.ts`                    | 8                                                          |
| Zod parsers                          | `apps/web/backend/http/__tests__/inputs.test.ts`                              | 18                                                         |
| Markdown renderer                    | `apps/web/frontend/features/questions/components/__tests__/markdown.test.tsx` | 9                                                          |
| Question feed/row/detail/answer-list | `apps/web/frontend/features/questions/components/__tests__/*.test.tsx`        | 18                                                         |
| Ask form                             | `apps/web/frontend/features/ask/components/__tests__/ask-form.test.tsx`       | 3                                                          |
| CXC AI components                    | `apps/web/frontend/features/cxc-ai/components/__tests__/*.test.tsx`           | 7 (citation-bubble 3, message-list 2, chat-history-rail 2) |
| DB queries — questions (existing)    | `packages/db/src/__tests__/questions.queries.test.ts`                         | 11                                                         |
| DB queries — tags (new)              | `packages/db/src/__tests__/tags.queries.test.ts`                              | 3                                                          |
| DB queries — cxc retrieval (new)     | `packages/db/src/__tests__/cxc.queries.test.ts`                               | 3                                                          |
| **Total**                            |                                                                               | **100**                                                    |

Workspace split: **83 web** + **17 db** = 100. The `packages/ui` workspace
runs `vitest --passWithNoTests`; primitives there are still trivial enough
that adding tests would burn cap with no upside.

## Intentionally skipped

- **Route handler tests** (`apps/web/app/api/__tests__/`). Each handler is a
  10-line wrapper: `parse → service → DTO` plus `try/catch → jsonError`.
  The parser tests cover the `400` paths, the service tests cover the
  `404`/business-logic paths, and `jsonError` is invoked the same way in
  every route. Adding handler-level tests would just verify that mocked
  functions are called — toy coverage. Per the brief's "if a planned area
  is trivial, skip it" guidance.
- **Auth-related coverage**. Auth tables/services landed in a parallel
  workstream during this task. The two existing auth-aware cases on
  `questions.service.test.ts` were written by that stream; this task did
  not add or modify them.
- **`packages/ui` primitives**. Pure presentational wrappers (Button,
  Badge, Tag, …) with no logic worth asserting beyond what eslint/tsc
  already covers.

## Mocking strategy

- **`@cardinalxchange/db`**: mocked at the import boundary in service
  tests via `vi.mock("@cardinalxchange/db", …)`.
- **`prisma` client**: mocked at `../client` for db-package query helpers,
  using `vi.fn()` per Prisma method touched.
- **`fetch`**: spied via `vi.spyOn(globalThis, "fetch")` in `ask-form`
  tests — no real network calls.
- **`next/navigation`**: mocked for `chat-history-rail` (pathname) and
  `ask-form` (router).

## Fragile spots noticed while writing

- `relativeTime()` in `questions.mappers.ts` and `formatRelative()` in
  `answer-list.tsx` are duplicated implementations of "N min/hour/day
  ago". Worth extracting into `shared/utils/relative-time.ts` once auth
  ships and the relative-time format is locked in.
- `splitLabelTitle()` in `message-list.tsx` and `kindForLabel()` infer the
  source kind from a string-prefix heuristic. The shape would be more
  durable if the agent's source parts carried a typed `kind` field
  directly instead of being decoded from `"Question: …"` titles.
- `parseCxcChatInput`'s `passthrough()` policy means malformed parts can
  reach the agent runtime unchecked. Not breaking today, but worth a
  schema tightening pass before scaling tools.
