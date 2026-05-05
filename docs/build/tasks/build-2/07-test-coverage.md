# Task — Test Coverage Expansion

We have 22 starter Vitest cases across 4 workspaces. This task expands coverage to ~80-100 tests covering services, components, and route handlers.

## Goal

Add real, meaningful tests for the most fragile / load-bearing surfaces. Stop at ~80-100 tests total (no toy tests).

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading (in this order)

1. `vitest.workspace.ts` — root aggregator.
2. `apps/web/vitest.config.ts` — jsdom + react + tsconfig path aliases.
3. `apps/web/vitest.setup.ts` — jest-dom matchers loaded.
4. The 3 existing test files (study the conventions):
   - `packages/db/src/__tests__/questions.queries.test.ts`
   - `apps/web/frontend/features/questions/components/__tests__/markdown.test.tsx`
   - `apps/web/backend/http/__tests__/inputs.test.ts`
5. `STRUCTURE.md` — folder map, naming conventions.
6. `CLAUDE.md` — out-of-scope items (don't write tests for things that don't exist).

## What to test (priority order)

Add tests in `__tests__/` folders co-located with the code under test, matching existing convention.

### High priority — backend services (target ~25 tests)

- `apps/web/backend/questions/questions.service.ts`:
  - `listQuestionsForFeed({ tag, sort })` — empty DB, with sample data, tag filter narrows, sort options ordering. Mock `@cardinalxchange/db`.
  - `getQuestionDetail(slug)` — found, not found (throws `HttpError(404)`), with answers in correct order.
  - `createQuestion(input, viewer)` — happy path, slug collision handling, tag normalization.
- `apps/web/backend/answers/answers.service.ts`:
  - `addAnswer(questionId, input, viewer)` — happy path, missing question (404), slug echoes correctly.
- `apps/web/backend/tags/tags.service.ts`:
  - `listTagsForIndex()` — empty, populated, ordering (count desc then label asc).
- `apps/web/backend/search/search.service.ts`:
  - Title match outranks body match.
  - Tag filter narrows.
  - Empty query returns empty.

### High priority — Zod input parsers (target ~15 tests)

- `apps/web/backend/http/inputs.ts`:
  - `parseCreateQuestionInput` — already partially covered; add edge cases (max title length, max tags, unicode).
  - `parseCreateAnswerInput` — same.
  - `parseCxcChatInput` — accepts valid messages, rejects malformed.
  - Each parser should test: valid happy path, missing required field, wrong type, oversize, empty string, whitespace-only.

### Medium priority — frontend components (target ~25 tests)

- `apps/web/frontend/features/questions/components/__tests__/`:
  - `question-feed.test.tsx` — empty state (unfiltered, filtered tag, filtered query), populated rows render, tag click links resolve.
  - `question-row.test.tsx` — title/snippet/tags/meta render correctly; "1 answer" vs "N answers" pluralization.
  - `question-detail.test.tsx` — title, body markdown rendered, tags clickable, meta line.
  - `answer-list.test.tsx` — empty state, multiple answers in createdAt order.
  - `markdown.test.tsx` — already partially covered; add: code blocks, tables, blockquotes (the Wave 6 polish).
- `apps/web/frontend/features/ask/components/__tests__/ask-form.test.tsx`:
  - Title required validation.
  - Tag chip add/remove.
  - Submit calls `fetch` with the right shape (mock fetch).
- `apps/web/frontend/features/cxc-ai/components/__tests__/`:
  - `message-list.test.tsx` — user vs assistant rendering.
  - `citation-bubble.test.tsx` — Q/A vs web kind behavior (same tab vs new tab).
  - `chat-history-rail.test.tsx` — empty state, populated, active highlight.

### Medium priority — DB query helpers (target ~10 tests)

- `packages/db/src/__tests__/`:
  - `tags.queries.test.ts` — listTagsWithCounts ordering.
  - `cxc.queries.test.ts` — searchInternalContext returns capped, source-labeled rows.
  - Any other pure helpers in `packages/db/src/`.

Mock the Prisma client. Don't hit a real Postgres.

### Medium priority — route handlers (target ~10 tests)

- `apps/web/app/api/__tests__/`:
  - `questions.test.ts` — POST validates body, GET returns array.
  - `answers.test.ts` — POST creates, returns DTO.
  - `tags.test.ts` (if there's a tags route handler).
  - Each handler test: valid input → 200, invalid → 400, missing route param → 404.

## Hard rules

- **Tests must test real behavior**, not just `expect(x).toBeDefined()`. Each test asserts a specific contract.
- **Mock the Prisma client** for db tests; never hit Postgres.
- **Mock `fetch`** for components that call it; never hit the real network.
- **Tests live next to the code** in `__tests__/` folders, matching existing convention.
- **Do not** add e2e/Playwright tests — Vitest only.
- **Do not** test out-of-scope behavior (auth, votes, reputation).
- **Do not** introduce dependencies beyond Vitest + RTL (already installed).
- **Cap at 100 total tests**. Quality over quantity. If you find a fragile area not in this list, add it; if a planned area is trivial, skip it.

## Verification

- `pnpm test` — all green, count ~80-100 cases across 4 workspaces.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` — green.

## Output

Commit your work in **logical chunks** by area:

- `test: backend service tests (questions/answers/tags/search)`
- `test: zod parser coverage`
- `test: questions feature component tests`
- `test: cxc-ai feature component tests`
- `test: route handler tests`

Write a short note to `docs/build/proposals/test-coverage.md` listing per-area coverage counts and what you intentionally skipped.

## Report back

≤200 words. Total test count, per-area breakdown, anything fragile you noticed while writing tests.
