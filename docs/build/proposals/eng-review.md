# Engineering Review — Build 1, Wave 4

Author: Eng Review agent (report-only).
Inputs: `docs/build/{01-organization,02-backend,03-frontend}.md`,
`docs/build/proposals/{structure,backend,frontend,cxc-ai-rail}-implementation.md`,
`CLAUDE.md`, plus the live tree under `apps/web/**`, `packages/db/src/**`,
`packages/ui/src/**`.

## 1. TL;DR

- **Verdict: ship after fix.** `pnpm typecheck`, `pnpm lint`, and `pnpm build` all
  exit 0; boundaries are largely respected; the four panels are implemented end
  to end.
- Two real bugs: the answer-list comes back in `desc` order instead of the
  spec'd `asc`, and `POST /api/cxc-ai/chats/[chatId]/messages` bypasses the zod
  parsers that the brief makes mandatory for every POST.
- The CXC AI persistence flow has a silent-data-loss race: assistant messages
  only persist when the **client** posts back via `onFinish`, so closing the
  tab mid-stream loses the assistant turn.

## 2. Findings

### Block

**B1 — Answer ordering is reversed (server returns desc, frontend claims asc).**
- `packages/db/src/types.ts:14-18` — `questionInclude.answers.orderBy = { createdAt: "desc" }`.
- `packages/db/src/answers.queries.ts:21` — `listAnswerRecords` orders `createdAt: "desc"`.
- `apps/web/features/questions/components/answer-list.tsx:4` — comment states the list is rendered in `createdAt asc` order, but it just maps the DTO array as-is.
- `docs/build/02-backend.md:30` calls for `Answer(questionId, createdAt asc)`; `docs/build/03-frontend.md:67` says the answer list is rendered in `createdAt asc`.
- Fix: change both order-bys to `asc`. Note that `apps/web/server/questions/questions.service.ts:72` reads `latestAnswer = question.answers[0]` to compute `activity`; once the include is `asc`, that line must become `question.answers[question.answers.length - 1]` (or sort separately) so the "new answer N min ago" meta keeps pointing at the most recent answer.

**B2 — `POST /api/cxc-ai/chats/[chatId]/messages` skips the zod parser contract.**
- `apps/web/app/api/cxc-ai/chats/[chatId]/messages/route.ts:27-46` rolls its own `parseMessages` + `isUiMessage` shape check, throwing a hand-rolled `HttpError(400, "invalid_messages", …)`.
- The brief (`docs/build/02-backend.md:48`) and the structure contract require every POST to parse via `server/http/inputs.ts`. `cxcChatInput` already expresses the message shape; the route should call `parseCxcChatInput` (or a new sibling parser) so all client-driven persistence shares the same validation surface.
- Fix: introduce a `parseChatMessagesInput` (or reuse `cxcChatInput` and accept that `id` is implied by the URL) in `server/http/inputs.ts` and replace the inline checker.

**B3 — `OPENAI_API_KEY` is read outside `server/cxc-ai/agents/` + `server/cxc-ai/services/`.**
- `apps/web/app/api/cxc-ai/route.ts:58` reads `process.env.OPENAI_API_KEY` to gate the fallback path.
- The brief (`docs/build/02-backend.md:87`, `CLAUDE.md` "CXC AI" §) says: "OPENAI_API_KEY is read only inside `server/cxc-ai/agents/` and `services/`. If missing, `chat.service.ts` falls back to an extractive answer."
- Fix: move the gate down into `chat.service.ts` (export an `isModelConfigured()` helper, or have `chat.service.streamTurn(...)` itself decide between the model path and `buildFallbackAnswer`). The route handler should not branch on the env var.

**B4 — Assistant message + sources persistence depends on the client.**
- `apps/web/app/api/cxc-ai/route.ts:44` persists the user-side messages and pre-computed sources before streaming begins.
- The assistant message itself only lands in Postgres if the browser stays open long enough to fire `useChat`'s `onFinish` (`apps/web/features/cxc-ai/hooks/use-cxc-chat.ts:37-46`), which then POSTs the final message array back to `/api/cxc-ai/chats/[chatId]/messages`.
- If the tab closes mid-stream, the entire assistant turn is lost. There is no server-side `streamText` `onFinish` callback wired, no `consumeStream`, no abort handler.
- Fix: have the route compose the stream via `result.toUIMessageStream({ onFinish })` (or `streamText({ onFinish })`) and call `replaceAiChatMessages` server-side once the stream settles. The client-side `onFinish` POST can stay as a refresh hint, but durability must not depend on it.

**B5 — `chat.service.replaceAiChatMessages` clobbers persisted sources.**
- `apps/web/server/cxc-ai/services/chat.service.ts:48-64` calls `replaceAiChatSessionMessages(..., messages, sources?)`. The route handler at `apps/web/app/api/cxc-ai/route.ts:44` passes the pre-stream sources, then `useCxcChat.onFinish` re-calls `replaceAiChatMessages` (via the messages route) **without** sources.
- `packages/db/src/cxc.mutations.ts:74-94` skips source mutation when `sources` is `undefined`, which is the right escape hatch. But messages are still wholly replaced by the second call, breaking the foreign-key relationship: any `AiChatSource.messageId` rows that point at the old assistant message id are nulled out (FK is `onDelete: SetNull`), and the new assistant message lands without `messageId` linkage.
- Fix: persist messages and sources together in one server-side write at stream completion (see B4). Drop the `messages` route or make it idempotent (match by `uiMessageId` rather than wholesale deleting + recreating).

### Fix

**F1 — `toQuestionStatus` returns a value outside the wire union.**
- `apps/web/server/questions/questions.service.ts:115-117`: `return status.toLowerCase() as QuestionStatus` — Prisma enum has `OPEN | ANSWERED | ACCEPTED` (`packages/db/prisma/schema.prisma:9-13`); the wire DTO union (`apps/web/server/http/contracts.ts:4`) is `"open" | "answered"`. `ACCEPTED` is unreachable today (no writer), but the cast is unsafe and the `as` is a type-laundering hazard.
- Fix: drop `ACCEPTED` from the schema (out-of-scope migration), or map explicitly: `status === "ACCEPTED" ? "answered" : status.toLowerCase()`.

**F2 — `listQuestionsForFeed` has no pagination / `take` cap.**
- `apps/web/server/questions/questions.queries.ts:16-25` builds `ListQuestionRecordsArgs` from `{ tag, sort }` only — `take` is never set.
- `packages/db/src/questions.queries.ts:12-45` honours `take` if passed; without it, the feed loads every Question row plus every Answer for every row (`questionInclude` has no `take` either, see F3).
- DB is empty in dev, so this is silent today, but the API returns the entire table when populated.
- Fix: pass a default `take` (50?) and add a cursor or page param. Cap `questionInclude.answers` to e.g. `take: 1` for the feed include, and use a separate include for the detail page.

**F3 — `questionInclude.answers` has no row cap.**
- `packages/db/src/types.ts:14-19` includes every answer for every question. The feed only needs `count` + the latest answer's timestamp; the detail page is the only caller that needs the full list.
- Fix: split into `questionFeedInclude` (with `_count.answers` + `answers: { take: 1, orderBy: { createdAt: 'desc' } }`) and `questionDetailInclude` (full list, asc).

**F4 — `searchQuestionRecords` over-fetches before in-memory ranking.**
- `packages/db/src/questions.queries.ts:126-132` loads `Math.max(limit * 4, limit)` candidates with full answers eagerly, then ranks in JS via `rankQuestion`. For the default `limit = 12` that is up to 48 questions × N answers loaded just to score by substring containment.
- This is fine at MVP scale but becomes the slowest hot path the moment the DB has thousands of questions.
- Fix: switch the candidate query to a Postgres `tsvector` / `pg_trgm` rank, or at minimum use `_count.answers` instead of pulling answer bodies inside `rankQuestion`.

**F5 — `/cxc-ai` index mints an empty `AiChatSession` row on every visit.**
- `apps/web/app/cxc-ai/page.tsx:10` calls `createAiChatSession()` unconditionally.
- An idle visit, a refresh, or a bot crawl creates a row that is never written to. The frontend implementation report flags this (Open Q5) but did not address it.
- Fix: defer session creation to first send. Either generate a `crypto.randomUUID()` client-side and `ensureAiChatSessionRecord` on the first POST, or have the index page render `<ChatShell chatId={null} isNewChat />` and route to `/cxc-ai/[chatId]` after the first user message lands.

**F6 — `globals.css` references a deleted directory.**
- `apps/web/app/globals.css:3` — `@source "../components";`. The `components/` folder was deleted in Wave 1 (per `structure-implementation.md`).
- Fix: drop the line; Tailwind warns on missing globs and we lose nothing by removing it.

**F7 — `decodeDraft` JSON.parse not size-bounded.**
- `apps/web/app/(forum)/ask/page.tsx:50` parses `JSON.parse(decodeURIComponent(value))` from a query string with no size cap.
- A pathological URL with megabytes of JSON would force the server to allocate during render. Low priority because it is server-side and bounded by URL-length limits at the proxy, but worth a length guard (`if (value.length > 8192) return undefined`).

**F8 — `top-command-bar.tsx` SearchFallback has no `aria-label`.**
- `apps/web/features/shell/components/top-command-bar.tsx:95-101`: the fallback rendered during Suspense is `aria-hidden` but during fallback the search input is unreachable for keyboard users.
- Fix: render an `<input disabled aria-label="Search questions">` placeholder so a screen reader user does not see the search disappear during hydration.

### Polish

**P1 — `apps/web/server/cxc-ai/index.ts` does not re-export `./types`.**
- `apps/web/server/cxc-ai/index.ts:1-18` re-exports `./agents` and `./services`. The `types/` barrel exists (`apps/web/server/cxc-ai/types/index.ts`) and exports `CxcAgentInvocation`, `CxcRetrievalScope` — neither is reachable through the package barrel.
- Fix: add `export type { CxcAgentInvocation, CxcRetrievalScope } from "./types";`.

**P2 — `apps/web/server/index.ts`, `apps/web/lib/index.ts`, `apps/web/utils/index.ts` are still `export {};`.**
- All three sit on top of populated subtrees (or have a single sibling like `viewer.ts`). The structure brief makes the barrel canonical; stub barrels mean every consumer must deep-import.
- Fix: at minimum, `apps/web/lib/index.ts` should re-export `getViewer`/`Viewer` from `./viewer`.

**P3 — Cross-feature server import: `answers.service` imports from `questions.service`.**
- `apps/web/server/answers/answers.service.ts:7` imports `toAnswerDto` from `@/server/questions/questions.service`. Same for `apps/web/server/search/search.service.ts:6` (`toDetailDto`, `toSummaryDto`).
- `01-organization.md:174` says "no deep imports across these boundaries from outside the folder", but here a sibling service deep-imports a peer service rather than a shared mapper module.
- Fix: hoist `toAnswerDto`, `toDetailDto`, `toSummaryDto` into a shared module — `apps/web/server/questions/questions.mappers.ts` or `apps/web/server/http/mappers.ts` — and re-export through the relevant barrel.

**P4 — Naming: `packages/db/src/types.ts` should be `db.types.ts` per the suffix convention.**
- `01-organization.md:165` requires `*.types.ts`. The existing file is at `packages/db/src/types.ts` (no noun prefix). It is a Prisma-include-types module; renaming to `db.types.ts` keeps it consistent.

**P5 — `searchInternalContextDetailed` is dead code.**
- `apps/web/server/search/search.service.ts:63-72` is exported through the barrel but no caller exists (verified via grep). Likely a leftover from a previous wiring pass.
- Fix: delete it (and drop from `search/index.ts`).

**P6 — `createCxcChatInput` back-compat alias.**
- `apps/web/server/http/inputs.ts:155` keeps `createCxcChatInput = cxcChatInput` "for tests / older imports". No tests exist and `createCxcChatInput` is only referenced from `server/http/index.ts:14` (re-export) — no real consumer.
- Fix: drop the alias and the re-export.

**P7 — `topic-rail.tsx` rail labels do not match `topics.data.ts`.**
- `apps/web/data/topics.data.ts:20-25` declares `Home / Questions / Tags / CXC AI`.
- `docs/build/03-frontend.md:20` says the rail items should be `Home / Questions / Tags / CXC AI` — matches now. The earlier wave note (`structure-implementation.md` Open Q4) referenced a `Topics / Trending` plan; that is resolved. No fix, just confirming.

**P8 — `console.error(error)` in error.tsx files.**
- `apps/web/app/cxc-ai/error.tsx:14`, `apps/web/app/(forum)/{ask,questions,questions/[questionId]}/error.tsx`. Acceptable in error boundaries (Next does not surface error.tsx output otherwise) but worth gating on `process.env.NODE_ENV === "development"` if you want the production console silent.

**P9 — `MessageList` `MessagePart` final fallback returns `null` twice.**
- `apps/web/features/cxc-ai/components/message-list.tsx:122-123` — the `if (isUser) return null; return null;` branch is unreachable code.
- Fix: collapse to `return null;`.

**P10 — `useCxcChat` does not handle the persistence POST failure.**
- `apps/web/features/cxc-ai/hooks/use-cxc-chat.ts:38-46` fires-and-forgets the persistence call. If the network drops between stream completion and the POST, the assistant message vanishes from history without any UI affordance.
- Related to B4 — once the server persists at stream end, this becomes an optimization rather than a durability concern.

### Taste

**T1 — `app/api/cxc-ai/chats/[chatId]/messages` is a separate route.**
- The "post the finished assistant turn" channel is split from the streaming POST. Once B4/B5 land, this route either becomes a no-op or duplicates the streaming path's persistence.
- Options:
  - (a) Keep the route as a "manual sync" endpoint useful for client recovery.
  - (b) Remove the route entirely; the streaming `POST /api/cxc-ai` handler becomes the sole source of truth.
- Recommendation: (b) once B4 is fixed.

**T2 — `searchInternalContext` lives in `server/search/search.service.ts`.**
- `02-backend.md:38` lists `searchInternalContext` under `server/cxc-ai`. Today it is in `server/search` and re-exposed through CXC retrieval.
- Options:
  - (a) Keep the current layering (search owns the helper; CXC AI just consumes it). One cohesive search surface.
  - (b) Move into `server/cxc-ai/services/retrieval.service.ts` and have it call db helpers directly. Matches the brief literally.
- Recommendation: (a) — it is reusable for `/api/search` and the SOC is cleaner.

**T3 — `force-dynamic` on `/cxc-ai/page.tsx` and `/cxc-ai/layout.tsx`.**
- The flag is correct because the layout reads `listAiChatSessions()` and the page mints a row on visit. After F5 lands, only the layout truly needs `dynamic = "force-dynamic"`.
- Options:
  - (a) Mark only the layout dynamic.
  - (b) Make the page static and rely on the layout to inject session list.
- Recommendation: (a).

**T4 — `MessageList` extracts sources and drafts from `parts` via stringly-typed `part.type.startsWith("source-")` / `includes("ask_community_draft")`.**
- This works against the AI SDK's loose `UIMessage` typing, but the kind discrimination is fragile to SDK changes.
- Options:
  - (a) Keep the loose `startsWith` checks; pin the AI SDK version.
  - (b) Define a strict discriminated union for our part kinds in `server/http/contracts.ts` and narrow at the boundary.
- Recommendation: (b) eventually; (a) is fine for the MVP.

## 3. Boundary Audit

| Source file | Imports | Verdict |
|---|---|---|
| `apps/web/features/**/*.{ts,tsx}` | only `@/server/http/contracts`, `@cardinalxchange/ui`, `@/data/*`, `next/*`, `react`, `ai`/`@ai-sdk/react` | ✅ matches `01-organization.md:208`. No `@cardinalxchange/db` or `@/server/<feature>` deep imports. |
| `apps/web/server/**/*.ts` | `@cardinalxchange/db`, `@/server/http/*`, `@/lib/viewer` | ✅ no React, no `@cardinalxchange/ui` imports anywhere under `server/`. |
| `packages/ui/src/**/*.{ts,tsx}` | only `react`, `class-variance-authority`, `clsx`, `tailwind-merge` | ✅ client-safe. |
| `apps/web/server/answers/answers.service.ts` | `@/server/questions/questions.service` | ⚠ same-tier deep import (P3). Not a hard violation but the brief discourages it. |
| `apps/web/server/search/search.service.ts` | `@/server/questions/questions.service` | ⚠ same as above. |
| `apps/web/app/api/cxc-ai/route.ts` | `process.env.OPENAI_API_KEY` | ❌ B3 — env var read outside `agents/` + `services/`. |
| `apps/web/server/cxc-ai/services/retrieval.service.ts` | `@/server/search/search.service` | ✅ inside `server/`, allowed; just adds the retrieval seam over the shared search helper. |
| `apps/web/server/questions/questions.queries.ts` | `import { Prisma }` … wait, actually only `@cardinalxchange/db` types | ✅ no Prisma import in the server tier (only in db package). |

## 4. Naming Audit

| File | Convention | Proposed rename |
|---|---|---|
| `packages/db/src/types.ts` | `*.types.ts` per `01-organization.md:165` requires a noun prefix | `db.types.ts` (or `prisma.types.ts`) |
| `packages/ui/src/primitives/{badge,button,divider,icon-button,input,pill,surface,tag,textarea}.tsx` | brief allows kebab-case files with PascalCase exports — these are fine | n/a |
| `apps/web/features/cxc-ai/hooks/use-cxc-chat.ts` | brief allows `hooks/` folder with one hook per file | n/a |
| `packages/db/src/client.ts` | the brief literally lists `client.ts` (no `*.types.ts` suffix needed for a singleton) | n/a |
| `apps/web/server/cxc-ai/agents/cxc.agent.ts` | matches `*.agent.ts` | n/a |
| `apps/web/server/cxc-ai/agents/prompts/{system,ask-the-community}.prompt.ts` | matches `*.prompt.ts` | n/a |

No other suffix violations. All component files are kebab-case, all components export PascalCase identifiers (sometimes also `default` — extra exports, but the brief permits both).

## 5. Verification Status

Read-only commands run from repo root with `npm exec pnpm@10.33.2 -- <cmd>`:

| Command | Exit | Notes |
|---|---|---|
| `pnpm typecheck` | **0** | Turbo cache hits for config/db/ui; web ran fresh. All four workspaces pass. |
| `pnpm lint` | **0** | Full Turbo cache hit. All workspaces pass with `--max-warnings=0`. |
| `pnpm build` | **0** | Web app cache miss → fresh Next 16.2.4 (Turbopack) build. All 14 routes compiled (`/`, `/ask`, `/cxc-ai`, `/cxc-ai/[chatId]`, `/questions`, `/questions/[questionId]`, `/questions/ask` static; `/api/*` dynamic). |
| `pnpm --filter @cardinalxchange/db prisma:validate` | **0** | Schema valid. |
| Console / no-`any` audit | **clean (server, db, ui, lib, utils, features)** | Only `console.error` in error boundaries (P8). No `as any`, no `// @ts-expect-error`, no leftover `console.log`. |
| Boundary grep (`@cardinalxchange/db` outside `apps/web/server` + db pkg) | **clean** | features/, lib/, utils/, packages/ui all clean. |
| Seed data audit | **empty** | `packages/db/prisma/seed.mjs` is `process.exit(0)`; no fixtures hardcoded outside `apps/web/data/topics.data.ts`. |

## 6. Taste Calls (Decisions for the User)

Already enumerated under §2 Taste. Recap with recommendations:

1. **Drop `/api/cxc-ai/chats/[chatId]/messages` once stream-completion persistence is server-side?** → Recommend yes (T1).
2. **Keep `searchInternalContext` in `server/search` (current) or move to `server/cxc-ai/services/retrieval.service.ts` (per literal brief)?** → Recommend keep (T2).
3. **`force-dynamic` on `/cxc-ai/page.tsx` after F5?** → Drop the page-level flag, keep the layout-level flag (T3).
4. **Strict-typed `UIMessage` parts in `server/http/contracts.ts`?** → Defer; keep loose `startsWith` checks for the MVP (T4).

## 7. Open Questions

1. **Pagination contract.** Brief never specifies feed pagination (cursor vs offset, page size). Wave 5 should pick one before F2 lands so the wire DTO does not break later.
2. **`AiChatSession.viewerKey`?** The schema (`packages/db/prisma/schema.prisma:83-92`) has no `viewerKey` field, but `02-backend.md:24` lists one. The brief was ahead of the schema; auth is the last milestone, so dropping the field from the brief or adding a nullable column on schema is a downstream call.
3. **Title inference quality.** `chat.service.inferTitle` (`apps/web/server/cxc-ai/services/chat.service.ts:76-88`) just slices the first user message at 60 chars. Fine for MVP, but no path to "rename chat" exists. Backlog.
4. **Public Q&A scope on retrieval.** `searchInternalContext` does not filter by `Question.status`; if we ever introduce drafts/private rows, the helper inherits whatever the schema lets through. Today every Question is public, so this is theoretical.
5. **Web-context source dedup.** `web-context.service.ts` hashes the URL when the upstream omits an `id` (`hashUrl`); collision behaviour and persistence-key stability are untested. Consider switching to `crypto.subtle.digest` if/when this becomes a real source.

---

End of report. No code was modified by this agent.
