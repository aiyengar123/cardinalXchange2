# Backend Implementation — Build 1, Wave 2

Author: Backend Agent.
Inputs: `docs/build/02-backend.md`, `docs/build/proposals/structure-implementation.md`, `docs/build/01-organization.md`, `docs/architecture.md`, `CLAUDE.md`, plus the canonical visual spec at `~/.codex/generated_images/.../ig_05b26d49…ce.png`.

This wave fleshes out the role-suffixed query/mutation files in `packages/db/src/`, splits each `server/<feature>/` folder into `*.service.ts + *.queries.ts + *.mutations.ts + *.types.ts + index.ts`, populates barrels, switches input parsing to zod, adds the missing `/api/search` route, and wires per-feature CXC AI prompts.

## DB changes

No schema migration was required — the existing schema (Wave 1) already covers every model and index the brief calls for: `Question`, `Answer`, `Tag`, `QuestionTag`, `AiChatSession`, `AiChatMessage`, `AiChatSource` with `Question(createdAt)`, `Question(lastActivityAt)`, `Answer(questionId, createdAt)`, and `AiChatMessage(sessionId, createdAt)` indexes.

What changed inside `packages/db/src/`:

- `questions.queries.ts` — `listQuestionRecords` now accepts `{ tag?, sort? }` (`sort` ∈ `newest | active | unanswered`); `searchQuestionRecords` now accepts an args object, applies a two-pass ranker that scores **title (6) > tag (4) > body (2) > answer body (1)** with a small "has answers" boost (0.25), and caps results.
- `cxc.queries.ts` — added `searchInternalContext(query, { limit, tags })` returning capped, source-labeled `InternalContextRow[]` (kind, refId, questionId, answerId?, title, snippet, url) scoped to public Question/Answer only. No private chat history, drafts, or auth data.
- `index.ts` — barrel widened to re-export the new public symbols (`questionIdentityWhere`, `normalizeTagLabels`, `slugify`, `searchInternalContext`, plus the new arg/row types).

Migration name(s): none added. `prisma:validate` and `prisma migrate deploy` against the dev DB both pass cleanly.

## Files populated

### `packages/db/src/`

| file | role |
|---|---|
| `questions.queries.ts` | `listQuestionRecords({ tag?, sort? })`, `getQuestionRecord`, `searchQuestionRecords({ query, tags?, limit? })` with title/tag-first ranking. Helpers `questionIdentityWhere`, `normalizeTagLabels`, `slugify` retained. |
| `cxc.queries.ts` | `createAiChatSessionRecord`, `getAiChatSessionRecord`, `listAiChatSessionRecords`, **new** `searchInternalContext` source-labeled retrieval helper. |
| `index.ts` | Barrel re-exports the full public surface so `@cardinalxchange/db` imports stay stable. |

(`questions.mutations.ts`, `answers.queries.ts`, `answers.mutations.ts`, `cxc.mutations.ts`, `client.ts`, `types.ts` unchanged from Wave 1.)

### `apps/web/server/`

| file | role |
|---|---|
| `http/contracts.ts` | Added `QuestionRowDto` (alias of `QuestionSummaryDto`), `CxcMessageDto`, `CxcSourceDto` for brief-aligned naming. |
| `http/inputs.ts` | Switched to **zod schemas** — `createQuestionInput`, `createAnswerInput`, `cxcChatInput` — with `parseCreateQuestionInput`, `parseCreateAnswerInput`, `parseCxcChatInput`, `parseSearchInput`. Zod errors map to `HttpError(400, …)`. |
| `http/index.ts` | Real barrel re-exporting `HttpError`, `jsonError`, `jsonOk`, `readPayload`, all parsers, and every wire DTO. |
| `questions/questions.service.ts` | `listQuestionsForFeed({ tag?, sort })`, `getQuestionDetail`, `createQuestion`. `listQuestions` retained as deprecated alias for transitional callers. |
| `questions/questions.queries.ts` | New thin wrappers `findQuestionsForFeed`, `findQuestionByIdentity`. |
| `questions/questions.mutations.ts` | New thin wrapper `persistQuestion`. |
| `questions/questions.types.ts` | New `FeedSort`, `ListQuestionsForFeedArgs`. |
| `questions/index.ts` | Real barrel. |
| `answers/answers.service.ts` | `addAnswer`, `listAnswers` (now using `persistAnswer`). |
| `answers/answers.mutations.ts` | New `persistAnswer`. |
| `answers/answers.types.ts` | New `AnswerAuthorOverride`. |
| `answers/index.ts` | Real barrel. |
| `search/search.service.ts` | New `search(query, { tag, limit })` returning `QuestionSummaryDto[]`. `searchInternalContext` now returns `AiChatSource[]` (used by retrieval). |
| `search/search.queries.ts` | New thin wrappers `findMatchingQuestions`, `findInternalContext`. |
| `search/search.types.ts` | New `SearchOptions`. |
| `search/index.ts` | Real barrel. |
| `cxc-ai/agents/prompts/system.prompt.ts` | New — voice + scope + safety; `buildSystemPrompt`, `cxcAiSystemPersona`, `formatSourcesForPrompt`. |
| `cxc-ai/agents/prompts/ask-the-community.prompt.ts` | New — `askCommunityToolName/Description/Guidance`. |
| `cxc-ai/agents/prompts/index.ts` | Real barrel. |
| `cxc-ai/agents/cxc.agent.ts` | Now composes the prompt module; tool definitions use the prompt-defined description. |
| `cxc-ai/agents/index.ts` | Real barrel. |
| `cxc-ai/services/retrieval.service.ts` | Now consumes `search.service.searchInternalContext` plus optional `web-context.service.fetchWebContext`. Internal results outrank web. |
| `cxc-ai/services/web-context.service.ts` | New — opt-in via `WEB_CONTEXT_ENDPOINT` (+ `WEB_CONTEXT_API_KEY`); no-op when unset. |
| `cxc-ai/services/chat.service.ts` | Unchanged from Wave 1. Persists `AiChatSession`, `AiChatMessage`, `AiChatSource` via Prisma. |
| `cxc-ai/services/index.ts` | Real barrel. |
| `cxc-ai/types/cxc.types.ts` | New internal types `CxcAgentInvocation`, `CxcRetrievalScope`. |
| `cxc-ai/types/index.ts` | Real barrel. |
| `cxc-ai/index.ts` | Real barrel re-exporting agents + services. |

## Routes wired

| Method | Path | Service it calls |
|---|---|---|
| `GET` | `/api/questions?tag=…&sort=newest|active|unanswered` | `questions.service.listQuestionsForFeed` |
| `POST` | `/api/questions` | `questions.service.createQuestion` (parsed by `parseCreateQuestionInput`) |
| `GET` | `/api/questions/[questionId]` | `questions.service.getQuestionDetail` |
| `POST` | `/api/questions/[questionId]/answers` | `answers.service.addAnswer` (parsed by `parseCreateAnswerInput`) |
| `GET` | `/api/questions/[questionId]/answers` | `answers.service.listAnswers` |
| `GET` | `/api/search?query=…&tag=…` *(new)* | `search.service.search` |
| `POST` | `/api/cxc-ai` | `cxc-ai/services/chat.service.replaceAiChatMessages` + `agents/cxc.agent` (streams via AI SDK) |
| `GET` | `/api/cxc-ai/chats/[chatId]` | `chat.service.getAiChatSnapshot` |
| `POST` | `/api/cxc-ai/chats/[chatId]/messages` | `chat.service.replaceAiChatMessages` |

Every handler is ~10 lines: parse input → call service → return DTO via `jsonOk` (errors funnel through `jsonError`). No business logic in handlers.

## CXC AI behavior

- `OPENAI_API_KEY` is read **only** inside `server/cxc-ai/agents/` and `server/cxc-ai/services/` (the route handler itself just gates on `process.env.OPENAI_API_KEY` to choose the streaming path). When unset, `chat.service` falls back to an extractive answer assembled from retrieval results via `buildFallbackAnswer`. The fallback streams `text-start / text-delta / text-end` events so the AI SDK client UI behaves identically to a normal turn.
- Retrieval is restricted to public `Question`/`Answer` records via `searchInternalContext`. Optional web context (`WEB_CONTEXT_ENDPOINT`, `WEB_CONTEXT_API_KEY`) is appended only when the env var is set; otherwise `fetchWebContext` is a no-op.
- The `Ask the Community` tool returns a transient `{ title, body, tags }` draft. It never writes to the DB. Public posts only happen through `POST /api/questions` after explicit user action on the public form.
- After each turn the route persists `AiChatSession`, the full `AiChatMessage[]`, and the retrieved `AiChatSource[]` rows tied to the session via `replaceAiChatMessages`. Sources carry `kind ∈ {question, answer, web}`, `refId`, `title`, `snippet`, plus `sourceQuestionId`/`sourceAnswerId` foreign keys for internal rows.

## Open questions for Frontend Agent

**DTOs the frontend should import (from `@/server/http/contracts` or `@/server/http`):**

- `QuestionRowDto` (alias of `QuestionSummaryDto`) — the feed row.
- `QuestionDetailDto` — question detail page (includes `answersList: AnswerDto[]`).
- `AnswerDto` — answer composer + answer list.
- `CreateQuestionInput`, `CreateAnswerInput` — POST bodies for `/api/questions` and `/api/questions/[id]/answers`.
- `CxcMessageDto` (alias of `AiChatMessage = UIMessage`), `CxcSourceDto` (alias of `AiChatSource`), `AskCommunityDraft`, `AiChatSnapshot` — CXC AI surface.
- `QuestionTagDto`, `QuestionStatus` — feed/topic UI.

**Contract details:**

1. `GET /api/questions` accepts `?tag=<slug>&sort=newest|active|unanswered` and returns `{ questions: QuestionRowDto[] }`. The `unanswered` filter is now a real server-side sort (no answers), not just a client filter — the page-level filter in `app/questions/page.tsx` can move to a query string.
2. `POST /api/questions` returns `{ question: QuestionDetailDto }` with status `201`. Validation errors arrive as `{ error: { code: "invalid_question_input", message } }` with status `400`.
3. `GET /api/search` requires either `?query=` or `?tag=` and returns `{ results: QuestionRowDto[], query, tag }`.
4. `POST /api/cxc-ai` consumes the AI SDK's `useChat` payload (`{ id, messages }`) and streams `UIMessage` events. Source events (`source-url`) are written before model output so the message-list can render source pills before text.
5. `apps/web/app/questions/actions.ts` is intentionally still in place. The frontend should rewrite forms to call `fetch('/api/questions', …)` / `fetch('/api/questions/[id]/answers', …)` and then delete `actions.ts`.
6. The legacy `listQuestions()` export from `@/server/questions/questions.service` is deprecated — prefer `listQuestionsForFeed({ tag, sort })`. Existing callers (`app/questions/page.tsx`, `app/questions/[questionId]/page.tsx`) keep working unchanged.

## Verification

- `pnpm typecheck` — exit 0. All four workspaces pass.
- `pnpm lint` — exit 0. All four workspaces pass with `--max-warnings=0`.
- `pnpm --filter @cardinalxchange/db prisma:validate` — schema is valid.
- `pnpm --filter @cardinalxchange/db prisma:deploy` — `No pending migrations to apply.`
- `pnpm test` (alias of `tsc --noEmit`) — exit 0.

## Image cross-check

All four panels in the visual spec have a backend surface:

- Panel 1 (feed) — `GET /api/questions?tag=…&sort=…` returning `QuestionRowDto[]`.
- Panel 2 (ask form) — `POST /api/questions` returning `QuestionDetailDto`.
- Panel 3 (question + multiple answers) — `GET /api/questions/[id]` (detail with `answersList`) + `POST /api/questions/[id]/answers`.
- Panel 4 (CXC AI chat) — `POST /api/cxc-ai` (stream + persist), `GET /api/cxc-ai/chats/[chatId]` (resume), plus the `Ask the Community` tool returning a transient draft.
