# 02 · Backend

Brief for the **Backend Agent**. Owns `packages/db` and `apps/web/server`. Stops at the route-handler boundary.

## Image

`file:///Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

The backend has to satisfy four read/write surfaces:

1. List questions for the feed (panel 1).
2. Create a question (panel 2).
3. Read one question with **all** of its answers, plus create an answer (panel 3).
4. Stream a CXC AI chat with retrieval over public Q&A and persist the session (panel 4).

## Database (Prisma — `packages/db`)

Models stay aligned with `docs/architecture.md`:

- `Question` — `id`, `title`, `body`, `authorDisplay`, `status`, `answerCount`, `createdAt`, `lastActivityAt`.
- `Answer` — `id`, `questionId`, `body`, `authorDisplay`, `createdAt`, `updatedAt`. Multiple answers per question.
- `Tag` — `id`, `slug`, `label`.
- `QuestionTag` — join `(questionId, tagId)`.
- `AiChatSession` — `id`, `viewerKey`, `title`, `createdAt`, `updatedAt`.
- `AiChatMessage` — `id`, `sessionId`, `role`, `content`, `createdAt`.
- `AiChatSource` — `id`, `messageId`, `kind` (`question` | `answer` | `web`), `refId`, `url`, `title`, `snippet`.

Indexes:
- `Question(createdAt desc)`, `Question(lastActivityAt desc)`.
- `Answer(questionId, createdAt asc)`.
- `AiChatMessage(sessionId, createdAt asc)`.

## Query Helpers (`packages/db/src`)

- `client.ts` — single `PrismaClient` with the Next.js dev hot-reload guard.
- `questions.queries.ts` — `listQuestions({ tag?, sort })`, `getQuestionWithAnswers(id)`.
- `answers.queries.ts` — `listAnswersForQuestion(id)`.
- `cxc.queries.ts` — `searchInternalContext(query, { limit })` returning capped, source-labeled rows.
- `index.ts` — barrel re-exporting helpers and Prisma types via `types.ts`.

`packages/db` exposes only async functions and types. No HTTP, no zod, no React.

## Server Layer (`apps/web/server`)

### `server/http`
- `http.ts` — `HttpError`, `jsonError`, `jsonOk` helpers.
- `inputs.ts` — zod schemas: `createQuestionInput`, `createAnswerInput`, `cxcChatInput`. Each exports a parser that throws `HttpError` on failure.
- `contracts.ts` — wire DTOs: `QuestionRowDto`, `QuestionDetailDto`, `AnswerDto`, `CxcMessageDto`, `CxcSourceDto`. These are the shared types client code is allowed to import.

### `server/questions`
- `questions.service.ts`
  - `listQuestionsForFeed({ tag?, sort })` → `QuestionRowDto[]`.
  - `getQuestionDetail(id)` → `QuestionDetailDto` (includes answer list).
  - `createQuestion(input, viewer)` → `QuestionRowDto`.
- `questions.queries.ts` thin wrappers over `@cardinalxchange/db`.
- `questions.mutations.ts` write paths.

### `server/answers`
- `answers.service.ts`
  - `addAnswer(questionId, input, viewer)` → `AnswerDto`.
  - `listAnswers(questionId)` → `AnswerDto[]` (already nested in question detail; keep this for future direct fetches).

### `server/search`
- `search.service.ts` — Postgres-backed search; rank title/tag matches above body matches; tag filter.

### `server/cxc-ai`

Strict three-folder split:

```
server/cxc-ai/
  agents/
    prompts/
      system.prompt.ts          # voice + scope + safety
      ask-the-community.prompt.ts
    cxc.agent.ts                # composes prompt + retrieval + tools
  services/
    chat.service.ts             # stream a turn, persist messages + sources
    retrieval.service.ts        # public Q&A only, capped, source-labeled
    web-context.service.ts      # opt-in WEB_CONTEXT_ENDPOINT; no-op if unset
  types/
    cxc.types.ts                # internal types; wire types live in server/http/contracts.ts
  index.ts
```

Rules:
- `OPENAI_API_KEY` is read only inside `agents/` and `services/`. If missing, `chat.service.ts` falls back to an extractive answer assembled from `retrieval.service.ts` results.
- The `Ask the Community` tool returns a transient `{ title, body, tags }` draft — never writes to the DB. Only the public question form, on explicit user click, performs the write through `questions.service.ts`.
- All retrieval results carry `kind`, `refId`, `title`, `snippet`. Persisted via `AiChatSource` rows tied to the assistant message.

## Routes (`apps/web/app/api`)

- `GET  /api/questions` — `listQuestionsForFeed` with `tag`, `sort` query.
- `POST /api/questions` — `createQuestion`.
- `GET  /api/questions/[questionId]` — `getQuestionDetail`.
- `POST /api/questions/[questionId]/answers` — `addAnswer`.
- `GET  /api/search` — `search.service.search(query, { tag })`.
- `POST /api/cxc-ai` — streams via AI SDK; persists session/messages/sources after stream completes.

Every route handler is ~10 lines: parse input → call service → return DTO. No business logic in the handler.

## Errors

- `HttpError(status, code, message, details?)` thrown from services.
- `jsonError(err)` translates to `NextResponse.json({ error: { code, message } }, { status })`.
- 4xx for input/auth/not-found, 5xx for unexpected.

## Environment

Backend reads (server-only):

```
DATABASE_URL
DIRECT_URL                # for migrations
OPENAI_API_KEY            # optional; CXC AI degrades gracefully if absent
OPENAI_MODEL              # defaults to gpt-5-mini
WEB_CONTEXT_ENDPOINT      # optional
WEB_CONTEXT_API_KEY       # optional
DEV_VIEWER_ID/NAME/META   # local viewer stub
```

Never introduce auth env vars in this build.

## Testing

There is no Vitest harness yet. `pnpm test` aliases to `tsc --noEmit`. Type-check must stay green; integration tests are deferred.

## Completion Note

```
## Completion Note
- What changed: 
- Open questions for next agent: 
- Image cross-check: 
```
