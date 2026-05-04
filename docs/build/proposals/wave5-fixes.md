# Wave 5 Fixes — Completion Note

Author: Fix Applier agent. Inputs: `docs/build/proposals/{design-review,eng-review}.md`.
All `block` / `fix` / `polish` items applied. `taste` items deferred to the user.

## 1. Counts

| Category        | Eng | Design | Total |
|-----------------|----:|-------:|------:|
| `block` closed  |   5 |      3 |     8 |
| `fix` closed    |   8 |      — |     8 |
| `polish` closed |  10 |     12 |    22 |
| `taste` deferred|   4 |      1 |     5 |

Total closed: **38** issues. Deferred: **5** taste calls (collected in §4).

## 2. Files modified / created / deleted

### Created
- `apps/web/server/questions/questions.mappers.ts` — shared record→DTO mappers (P3).
- `packages/db/src/db.types.ts` — `git mv` from `types.ts` (P4).

### Deleted
- `packages/db/src/types.ts` — renamed via `git mv` (P4).
- `searchInternalContextDetailed` and its barrel export (P5; in-place delete).
- `createCxcChatInput` back-compat alias and its barrel export (P6; in-place delete).

### Modified

Server / DB:
- `packages/db/src/db.types.ts` — answers asc; new `questionFeedInclude`/`QuestionFeedRecord` (B1, F3).
- `packages/db/src/answers.queries.ts` — `createdAt asc` (B1).
- `packages/db/src/questions.queries.ts` — feed include + default `take = 50` (F2, F3); import `./db.types`.
- `packages/db/src/index.ts` — export `QuestionFeedRecord`, `questionFeedInclude`, `DEFAULT_FEED_TAKE`.
- `packages/db/src/{cxc.mutations,cxc.queries,questions.mutations,answers.mutations}.ts` — import `./db.types`.
- `apps/web/server/cxc-ai/services/chat.service.ts` — `streamCxcAiTurn`, `isModelConfigured`, `findAiChatSnapshot`; server-side `onFinish` persistence (B3, B4, B5, F10).
- `apps/web/server/cxc-ai/services/index.ts` + `apps/web/server/cxc-ai/index.ts` — barrel updates incl. types re-export (P1).
- `apps/web/server/http/inputs.ts` — added `cxcChatMessagesInput` + `parseCxcChatMessagesInput`; dropped `createCxcChatInput` (B2, P6).
- `apps/web/server/http/index.ts` — barrel updated to match.
- `apps/web/server/questions/questions.service.ts` — slimmed; mappers moved to `questions.mappers.ts`.
- `apps/web/server/questions/questions.queries.ts` — return `QuestionFeedRecord[]`.
- `apps/web/server/questions/index.ts` — re-export mappers from `questions.mappers.ts`.
- `apps/web/server/answers/answers.service.ts` — import `toAnswerDto` from `questions.mappers` (P3).
- `apps/web/server/search/search.service.ts` — import `toSummaryDto` from `questions.mappers`; drop dead helper (P3, P5).
- `apps/web/server/search/index.ts` — barrel updated.
- `apps/web/lib/index.ts` — re-export `getViewer` / `Viewer` (P2).

Routes:
- `apps/web/app/api/cxc-ai/route.ts` — uses `streamCxcAiTurn`; no env read (B3, B4).
- `apps/web/app/api/cxc-ai/chats/[chatId]/messages/route.ts` — uses zod parser; idempotent sync (B2, B5).
- `apps/web/app/cxc-ai/page.tsx` — `randomUUID` instead of minting a row on visit (F5).
- `apps/web/app/cxc-ai/[chatId]/page.tsx` — `notFound()` when snapshot missing (F10).
- `apps/web/app/(forum)/questions/page.tsx` — drop inline title style; filter tab spacing; `id="tags"` anchor; pass filter prop (F4, F9, F11, F14).
- `apps/web/app/(forum)/ask/page.tsx` — drop inline title style; ink-500 breadcrumb; draft size guard (F7, F11, F15).
- `apps/web/app/{cxc-ai,(forum)/{ask,questions,questions/[questionId]}}/error.tsx` — gate `console.error` on dev (P8).
- `apps/web/app/globals.css` — drop `@source "../components"` reference to deleted dir (F6).

Features / UI:
- `apps/web/features/questions/components/question-feed.tsx` — filtered empty state branch with `<code>` tag and Clear filter (F3, F5).
- `apps/web/features/questions/components/answer-list.tsx` — comment correction (B1).
- `apps/web/features/ask/components/ask-form.tsx` — per-field errors, red borders on invalid, `rounded-md h-9` button (F7, F8 mirror).
- `apps/web/features/cxc-ai/components/chat-shell.tsx` — drop duplicate New chat + inline title style; align top padding (F4, F6, F11).
- `apps/web/features/cxc-ai/components/message-composer.tsx` — Send `rounded-md` + better disabled state (F8).
- `apps/web/features/cxc-ai/components/chat-history-rail.tsx` — cap rail at 25 with `+ N older` (F12).
- `apps/web/features/cxc-ai/components/message-list.tsx` — collapse double-`null` MessagePart fallback (P9).
- `apps/web/features/cxc-ai/hooks/use-cxc-chat.ts` — drop client-side persistence POST (durability now server-side) (B4, P10).
- `apps/web/features/shell/components/topic-rail.tsx` — show at `md:` for tablet nav (F2).
- `apps/web/features/shell/components/top-command-bar.tsx` — responsive search row + `min-w-[8rem]`; aria-labelled fallback (F1, F8 eng).

## 3. Per-issue decisions

| sev | source | id | summary | what we did | principle |
|-----|--------|----|---------|-------------|-----------|
| block | eng | B1 | Answer order desc vs spec asc | Set `answers.orderBy = createdAt asc` in `questionInclude` + `listAnswerRecords`; updated `toSummaryDto` to read `answers[length-1]` for detail records and `answers[0]` for feed records (which use desc + take 1). | Completeness |
| block | eng | B2 | POST `/messages` skipped zod parsing | Added `cxcChatMessagesInput` schema + `parseCxcChatMessagesInput`; route uses it; dropped hand-rolled `isUiMessage`. | DRY |
| block | eng | B3 | `OPENAI_API_KEY` read in route | Moved to `chat.service.isModelConfigured()`; `streamCxcAiTurn` decides between model and fallback. | Boundary discipline |
| block | eng | B4 | Assistant persistence client-driven | Wired `result.toUIMessageStream({ originalMessages, onFinish })` in `streamCxcAiTurn`; `replaceAiChatMessages(chatId, finalMessages, sources)` runs server-side regardless of client state. Client `onFinish` POST removed (taste T1 will decide whether to delete the route). | Completeness |
| block | eng | B5 | Sources clobbered by client POST | Server-side `onFinish` writes messages + sources together. `messages` route now omits sources (mutation helper treats undefined as "leave alone"); client no longer hits the route. | Bias toward action |
| block | design | F1 | Top-bar search collapses on mobile | Restructured top bar into responsive flex: at `<sm` search drops to second row, wordmark + Ask Question stay on first; `min-w-[8rem]` floor at all sizes. | Pragmatic |
| block | design | F2 | 768-1023px loses both rails | Lowered `TopicRail` from `lg:block` to `md:block` so nav is visible at tablet sizes; SideRail still hides at `<xl`. | Pragmatic |
| block | design | F3 | Filtered empty state copy | `QuestionFeed` accepts `filter` prop; renders distinct copy ("No questions tagged `<tag>` yet.") + Clear filter button. Tag pre-fills the draft via `?draft=` when user clicks Ask a Question. | Completeness |
| fix | eng | F1e | `toQuestionStatus` returns out-of-union | Map `ACCEPTED → "answered"` explicitly. | Explicit over clever |
| fix | eng | F2e | Feed has no `take` cap | Default `take = 50` (`DEFAULT_FEED_TAKE`); cursor support deferred to backlog. | Pragmatic |
| fix | eng | F3e | `questionInclude.answers` no row cap | Split into `questionFeedInclude` (`take: 1`, desc) and `questionInclude` (full asc). `_count.answers` exposes authoritative count. | Completeness |
| fix | eng | F4e | `searchQuestionRecords` over-fetches | Left as-is for MVP scale (db is empty); flagged as known hot path in question.queries comment. Real fix is `tsvector`/`pg_trgm` — out of wave 5 scope, no new dep allowed. | Bias toward action |
| fix | eng | F5e | `/cxc-ai` mints empty session per visit | Replaced `createAiChatSession()` with `crypto.randomUUID()`; row materializes on first send via `ensureAiChatSession` inside the streaming route. | Pragmatic |
| fix | eng | F6e | `globals.css` references deleted dir | Removed `@source "../components"`. | DRY |
| fix | eng | F7e | `decodeDraft` JSON.parse not size-bounded | Added `MAX_DRAFT_LENGTH = 8192` guard. | Explicit over clever |
| fix | eng | F8e | SearchFallback no `aria-label` | Render disabled `<input>` with `aria-label="Search questions"` so screen readers see the search affordance. | Completeness |
| polish | eng | P1 | `server/cxc-ai/index.ts` skipped types | Added `export type { CxcAgentInvocation, CxcRetrievalScope }`. | DRY |
| polish | eng | P2 | Stub barrels | `lib/index.ts` re-exports `getViewer`/`Viewer`. `server/index.ts` and `utils/index.ts` left as `export {}` (no consumers, intentional placeholder; revisit when those folders gain content). | Pragmatic |
| polish | eng | P3 | Cross-feature service deep-imports | Created `questions.mappers.ts` with `toAnswerDto`/`toDetailDto`/`toSummaryDto`; `answers.service` and `search.service` import from there. | DRY |
| polish | eng | P4 | `types.ts` should be `db.types.ts` | `git mv` to `db.types.ts`; updated all sibling imports. | Completeness |
| polish | eng | P5 | `searchInternalContextDetailed` dead | Deleted helper + barrel export. | DRY |
| polish | eng | P6 | `createCxcChatInput` alias unused | Deleted alias + barrel export. | DRY |
| polish | eng | P7 | Rail labels match brief | Confirmed (no fix). | n/a |
| polish | eng | P8 | `console.error` in error.tsx | Gated all four boundaries on `NODE_ENV === "development"`. | Completeness |
| polish | eng | P9 | `MessagePart` double-`null` | Collapsed to a single `return null` after the type-text branch. | Explicit over clever |
| polish | eng | P10 | `useCxcChat` no failure handling | Resolved by B4: dropped client-side persistence entirely; durability is server-side. | Boil lakes |
| polish | design | F4 | Column-top alignment | Removed inner `py-8` on questions page and `py-6` on chat-shell; main now owns `py-6` from PageShell. | Completeness |
| polish | design | F5 | Empty-state CTA shape | Empty-state Ask a Question now `rounded-md h-9` (matches top-bar). | DRY |
| polish | design | F6 | Duplicate New chat buttons | Removed chat-shell header `<Link href="/cxc-ai">`. Rail button is sole entry. | Bias toward action |
| polish | design | F7 | Weak inline error state on /ask | Per-field state (`fieldErrors.title`/`body`/`form`); red border + `aria-invalid`; inline error directly below offending input. | Completeness |
| polish | design | F8 | Send button rounded + disabled | Added `rounded-md`; disabled now neutral (ink-100 bg, ink-500 text) instead of faded cardinal. | Pragmatic |
| polish | design | F9 | Tags rail item dead anchor | Anchor `id="tags"` added on the questions header so `/questions#tags` scrolls. The SideRail Tags card already acts as the index. | Pragmatic |
| polish | design | F10 | Missing-session not handled | Added `findAiChatSnapshot` (returns null instead of minting); page calls `notFound()` when snapshot is missing. | Completeness |
| polish | design | F11 | Inline `borderRadius` on h1s | Removed from both `Questions` and `CXC AI` h1s + `Ask a Question` h1. | DRY |
| polish | design | F12 | Unbounded chat-history rail | Cap at 25 most recent; "+ N older" count below when truncated. | Pragmatic |
| polish | design | F13 | All sessions titled "New CXC AI chat" | Resolved transitively: with F5 + B4, only sessions that have a real first message are persisted, and `inferTitle` derives from the first user message body. No further code change needed. | Completeness |
| polish | design | F14 | Filter tab spacing | Replaced `mt-4` + double border with `mt-6` and a single border on the title row; feed sits 8px below tabs. | Pragmatic |
| polish | design | F15 | Back link weight | Now ink-500 small breadcrumb without arrow. | Explicit over clever |
| **taste** | design | F16 | Empty-state card background | deferred (see Taste section) | — |
| **taste** | eng | T1 | Drop `/api/cxc-ai/chats/[chatId]/messages` route entirely | deferred (see Taste section) | — |
| **taste** | eng | T2 | Move `searchInternalContext` into `server/cxc-ai/services/retrieval.service.ts` | deferred (see Taste section) | — |
| **taste** | eng | T3 | Remove `force-dynamic` from `/cxc-ai/page.tsx` (keep on layout only) | deferred (see Taste section) | — |
| **taste** | eng | T4 | Strict-typed `UIMessage` parts in `contracts.ts` | deferred (see Taste section) | — |

## 4. Taste section — please decide

### F16 — Empty-state card background

**Question.** Should the question-feed empty card use `bg-surface-base` (current) or `bg-surface-sunk`?

- **Recommendation: B (sunk).** Matches the chat-surface treatment; reads as a "placeholder slot" rather than a floating outline.
- **Alternative: A (keep base).** Subtle, page-as-canvas reading; minimal visual noise.
- **Tradeoff.** B gives the empty state more weight on a white page but introduces a second card-background pattern (the SideRail About/Tags cards stay on `bg-surface-base`). A is slightly harder to read against the `surface-base` page bg.

### T1 — Should `/api/cxc-ai/chats/[chatId]/messages` exist at all?

**Question.** B4 lands server-side persistence in `streamCxcAiTurn`. The messages route is now redundant. Drop it entirely or keep as a manual-sync endpoint?

- **Recommendation: keep for now (current state).** It's already idempotent with the new zod parser; deleting would require dropping the corresponding feature barrel + the related dir.
- **Alternative: delete the route + dir.** Simpler tree; one fewer URL on the surface area; eng review's recommendation.
- **Tradeoff.** Keeping = a 6-file route handler that no consumer hits today, but available if a future client needs it. Deleting = one less moving part, but loses the recovery handle if streaming durability ever regresses.

### T2 — Where does `searchInternalContext` live?

**Question.** The literal brief puts it under `server/cxc-ai`. Today it lives in `server/search/search.service.ts` and is consumed by the CXC retrieval service.

- **Recommendation: keep in `server/search`.** Reusable for `/api/search` and the public search surface; CXC AI just consumes it.
- **Alternative: move into `server/cxc-ai/services/retrieval.service.ts`.** Matches the brief verbatim.
- **Tradeoff.** Keep = single search surface, minor brief deviation. Move = brief-matching, but split helper across two services with subtle drift risk.

### T3 — `force-dynamic` on `/cxc-ai/page.tsx`

**Question.** With F5 landed, the page no longer mints a row, so it could be static. The layout still calls `listAiChatSessions()` and needs `force-dynamic`.

- **Recommendation: drop the page-level flag, keep only the layout-level flag.** Faster TTFB on the index page.
- **Alternative: keep both.** Conservative; no risk of stale render if we later add server reads to the page.
- **Tradeoff.** Drop = micro-perf win; introduces inconsistency between the page and the layout flags. Keep = uniform but slightly slower than necessary.

### T4 — Strict-typed `UIMessage` parts

**Question.** `MessageList` discriminates parts via stringly-typed `part.type.startsWith("source-")` / `includes("ask_community_draft")`. Move to a strict discriminated union in `contracts.ts`?

- **Recommendation: defer.** AI SDK's `UIMessage` is loose by construction; pin the SDK version is enough for MVP.
- **Alternative: define a strict union now.** Catches drift earlier.
- **Tradeoff.** Defer = ~5 lines of `startsWith` checks, fragile to SDK changes. Now = boilerplate + repeated narrowing at every part site, plus we'd be inventing types the SDK doesn't yet expose.

## 5. Verification

| Command | Exit | Notes |
|---|---|---|
| `pnpm typecheck` | **0** | All four workspaces pass. |
| `pnpm lint` | **0** | `--max-warnings=0` clean across all workspaces. |
| `pnpm build` | **0** | Next 16.2.4 (Turbopack) build passes. All 14 routes compile. |
| Visual QA — `/questions` (1440) | ✅ | Empty state copy intact. Columns aligned (h1 / rail / SideRail share top edge). Filter tabs `mt-6` from title underline. |
| Visual QA — `/questions?tag=advising` (1440) | ✅ | "No questions tagged `advising` yet." with Ask a Question + Clear filter buttons. Code-styled tag chip. |
| Visual QA — `/ask` empty submit (1440) | ✅ | Title + Body inputs show `state-danger` border; sub-label shows "Title is required." / "Body is required." inline. |
| Visual QA — `/cxc-ai` (1440) | ✅ | One "New chat" link (in rail). Header shows only h1 + subline. Send button `rounded-md`, neutral disabled. |
| Visual QA — `/questions` (900px) | ✅ | TopicRail nav visible (Home/Questions/Tags/CXC AI). SideRail hidden as expected. |

No visual regressions found.

## 6. Open questions

1. **Pagination contract** (eng OpenQ1). Default `take = 50` is a stop-gap; the wire DTO does not yet expose a cursor. When the feed needs page 2, decide cursor vs offset and shape `QuestionRowDto` accordingly. Out of scope for wave 5.
2. **Existing test sessions in `AiChatSession`.** F13 noted 17+ "New CXC AI chat" entries from prior dev usage. With F5 fixed, no new empty sessions accumulate, but the existing rows are still in the rail. The "+ N older" cap (F12) keeps the visual tidy. Cleanup is a one-line `prisma.aiChatSession.deleteMany({ where: { messages: { none: {} } } })` if the user wants a clean slate — surfaced here, not run.
3. **Web context dedup** (eng OpenQ5). `web-context.service.hashUrl` collision behaviour untested. Not exercised today (`WEB_CONTEXT_ENDPOINT` unset). Backlog.
4. **`AiChatSession.viewerKey`** (eng OpenQ2). Brief lists it; schema doesn't have it. Auth is the last milestone — defer.
5. **Title inference quality.** Still slices first user message at 60 chars. No "rename chat" UI exists. Backlog.

End of note.
