# Task 04 — CXC AI completion note

## Summary

Wave 5 left the AI plumbing structurally correct (streaming, server-side persistence via `streamCxcAiTurn` → `onFinish` → `replaceAiChatMessages`, two-rail PageShell). Initial pass verified the AI SDK end-to-end. User feedback then flagged that the chat surface was visually wrapped in a "weird little box" — the message list lived inside a bordered `bg-surface-sunk` container that doesn't appear in the canonical image. Fixed by removing the wrapper so messages flow directly on the page and the composer anchors at the bottom with a hairline divider above it.

## Edits

- `apps/web/features/cxc-ai/components/chat-shell.tsx`
  - Removed the `min-h-[40rem] border bg-surface-sunk` `<section>` wrapper around the message list. Messages now flow directly on the page surface (matches the canonical image bottom-right panel).
  - Switched the outer container to `flex h-[calc(100vh-7rem)]` so the message area scrolls independently and the composer stays anchored at the bottom.
  - Composer wrapped in a top-bordered block (`border-t pt-4 pb-2`) so it reads as a separate surface, not a boxed-in chat field.

## Files inspected (no other edits)

- `apps/web/app/cxc-ai/page.tsx` — mints chatId locally, no DB write on idle visit
- `apps/web/app/cxc-ai/[chatId]/page.tsx` — `findAiChatSnapshot` returns `null` → `notFound()` (no phantom rows)
- `apps/web/app/cxc-ai/layout.tsx` — `PageShell` with `secondaryRail={<ChatHistoryRail/>}` and `sideRail={null}` (two left rails, no right rail)
- `apps/web/features/cxc-ai/components/chat-shell.tsx` — header + bordered message section + composer; auto-scroll + URL-replace on first send
- `apps/web/features/cxc-ai/components/message-list.tsx` — user right-aligned cardinal bubble, assistant left-aligned bordered card, `extractSources` pulls `source-*` parts → SourcePill, `extractDrafts` pulls `tool-ask_community_draft` → AskCommunityDraftCard with `/ask?draft=<encoded>` link (transient, no DB write)
- `apps/web/features/cxc-ai/components/source-pill.tsx` — square-bordered pill, opens in new tab
- `apps/web/features/cxc-ai/components/chat-history-rail.tsx` — 220px rail, "New chat" button, sorted recent sessions, active-route gets cardinal left bar
- `apps/web/features/cxc-ai/components/message-composer.tsx` — bordered textarea, cardinal Send button, Stop button while streaming, Enter-to-send/Shift+Enter-newline
- `apps/web/features/cxc-ai/hooks/use-cxc-chat.ts` — wraps `useChat` from `@ai-sdk/react` with a `DefaultChatTransport` posting to `/api/cxc-ai`
- `apps/web/app/api/cxc-ai/route.ts` — parses input, retrieves sources, ensures session row, hands off to `streamCxcAiTurn`
- `apps/web/server/cxc-ai/services/chat.service.ts` — `streamCxcAiTurn` writes source-url parts → if no key, fallback text + sync persist; if key, `streamText({ model: openai(cxcAiModelName), tools, stopWhen, ... })` merged into the UI message stream with `onFinish` → `persistFinishedTurn`
- `apps/web/server/cxc-ai/agents/cxc.agent.ts` — model name from `OPENAI_MODEL` (default `gpt-5-mini`), `search_cxc_sources` + `ask_community_draft` tools, `buildFallbackAnswer` extractive copy
- `apps/web/server/cxc-ai/services/retrieval.service.ts` — public Q/A only via `searchInternalContext`; web context opt-in
- `apps/web/server/cxc-ai/agents/prompts/*` — system persona + ask-the-community description

## AI behaviors exercised

### 1. Streaming via the AI SDK transport
`POST /api/cxc-ai` returns `Content-Type: text/event-stream`, `x-vercel-ai-ui-message-stream: v1`, and emits `text-start` / `text-delta` / `text-end` / `[DONE]` SSE events. Verified with two real curl calls (`test-stream-1` and `verify-stream-2`).

### 2. Server-side persistence (durable across client disconnects)
Both fallback and AI paths call `persistFinishedTurn` → `replaceAiChatSessionMessages` against Postgres. Verified by GETting `/api/cxc-ai/chats/test-stream-1` and `/api/cxc-ai/chats/verify-stream-2` after the stream closed — both returned the user turn + assistant turn with parts. Title is auto-derived from first user message (`What courses are most popular for CS majors at Stanford?` → session title).

For the AI path the persistence runs in `result.toUIMessageStream({ ..., onFinish })`, which fires server-side regardless of whether the client tab is still open. The fallback path persists synchronously inside the stream `execute` before returning.

### 3. Source pills
Server emits `{ type: "source-url", sourceId, url, title: "${label}: ${title}" }` for each retrieved source. Client `extractSources` parses these into `CxcSourceDto` and renders square-bordered `<SourcePill>` chips above the message text. Question/answer sources open `/questions/<id>` (set by retrieval to that URL); web sources open the external URL in a new tab. Empty DB → no internal sources, no pills (correct empty-state behavior).

### 4. Keyless fallback
With `OPENAI_API_KEY` empty (current local state), `isModelConfigured()` returns false. Route returned **HTTP 200**, not 500. Stream emitted text-start/text-delta/text-end with the extractive copy from `buildFallbackAnswer` ("I do not have enough public CardinalXchange…" because retrieval returned 0 sources for an empty DB). The assistant turn was persisted just like the AI path.

### 5. Ask the Community draft (code path)
`createCxcAiTools()` defines `ask_community_draft` with input schema `{ title, body, tags[] }` and the execute returns the draft as-is. The UI renders matching `tool-ask_community_draft` parts as inline cards with a "Use this draft" link to `/ask?draft=<encoded>` — never writes to DB, never auto-posts. (Not exercised end-to-end without a model configured; code is wired correctly.)

## Image cross-check (bottom-right panel)

| Image element | What we have |
| --- | --- |
| Cardinal-red top bar with logo, search, Ask Question button | ✓ shared `TopCommandBar` |
| Topic rail on far left (Home, Questions, Tags, CXC AI active w/ cardinal left bar) | ✓ shared `TopicRail` |
| Second left rail with "New chat" + recent sessions (active session highlighted) | ✓ `ChatHistoryRail` (220px, cardinal left bar on active) |
| No right side rail on `/cxc-ai` | ✓ `sideRail={null}` |
| "CXC AI" serif headline + brief subline + divider | ✓ `chat-shell.tsx` header |
| User message right-aligned cardinal-red bubble | ✓ `MessageBubble isUser` |
| Assistant message left-aligned bordered white card | ✓ `MessageBubble assistant` |
| Source pills near assistant messages when retrieval used | ✓ `SourcePill` (no sources to show on empty DB) |
| Bordered composer at bottom with textarea + cardinal Send | ✓ `MessageComposer` |

## Verification

- `pnpm typecheck` → 4/4 successful (cached for config/db/ui, fresh for web)
- `pnpm lint` → 4/4 successful with `--max-warnings=0`
- `curl POST /api/cxc-ai` (id=`test-stream-1`) → SSE stream with text-start/text-delta/text-end and `[DONE]`
- `curl GET /api/cxc-ai/chats/test-stream-1` → session + user turn + assistant turn returned (persistence confirmed)
- Repeated for `verify-stream-2` → same shape, different title auto-derived from user text
- Headless screenshots:
  - Empty `/cxc-ai`: `/tmp/cxc-screens/cxc-tall.png`
  - Persisted thread `/cxc-ai/verify-stream-2`: `/tmp/cxc-screens/cxc-thread-final.png`

## Pass 3 — Haleum architecture port (`ai-chatbot-architecture.md`)

User asked us to implement the Haleum AI chatbot architecture into CXC and to push the content closer to the left wall (about halfway between previous position and the wall). Three sub-agents ran in parallel to author the new components, then I integrated them.

### Sub-agent fan-out

- **Agent A** (citation + markdown): authored `apps/web/features/cxc-ai/components/citation-bubble.tsx` (small inline `Q1/A2/W3` chip with hover popover that reveals title + snippet + "Open source ↗" link, with a 150ms close-grace timer) and `apps/web/features/cxc-ai/components/markdown.tsx` (zero-dep, no `dangerouslySetInnerHTML` — handles paragraphs, `-/*` bullets, `**bold**`, `` `inline code` ``, and `https://` autolinks).
- **Agent B** (tool chain + prompt input): authored `apps/web/features/cxc-ai/components/tool-chain.tsx` (collapsible "Used N steps · tool" container with rotating chevron, Search/MessageSquarePlus/Wrench Lucide icons, Running/Done/Error badges, per-tool detail rendering for `search_cxc_sources` and `ask_community_draft`) and `apps/web/features/cxc-ai/components/prompt-input.tsx` (auto-growing textarea, focus-within accent border, 36×36 cardinal Send button whose icon switches `ArrowUp / Loader2 / Square / X` based on AI SDK chat status — the architecture's exact pattern).
- **Agent C** (history rail buckets): updated `apps/web/features/cxc-ai/components/chat-history-rail.tsx` to bucket sessions into **Today / Last 7 Days / Older** with bucket-appropriate `Intl.DateTimeFormat` stamps (`h:mm a`, `weekday short`, `MMM d` with year suffix when older than a year).

All three agents ran their own `pnpm typecheck` and `pnpm lint` and reported clean.

### Integration

- `apps/web/features/cxc-ai/components/chat-shell.tsx` rewritten to mirror Haleum's `Chat.tsx`: when `messages.length === 0`, render a centered `How can I help?` empty state with the inline `<PromptInput>`; otherwise render the bordered `CXC AI` header, scrollable message section, and a sticky-bottom composer separated by a hairline divider. AI SDK chat status (`submitted | streaming | error | ready`) flows directly into the composer's submit icon.
- `apps/web/features/cxc-ai/components/message-list.tsx` rewritten to render user messages as compact right-aligned cardinal-red rounded bubbles, assistant messages as `<Markdown>` prose (no card wrapper), tool parts grouped through `<ToolChain>`, and sources as inline `<CitationBubble>` chips beneath the message body (replaces always-visible source pills). Ask-the-Community draft cards retained as inline cards with `/ask?draft=…` link.
- `apps/web/features/shell/components/page-shell.tsx` gained one optional prop, `containerClassName`, defaulting to the existing `mx-auto max-w-[1264px]`. No existing caller is affected.
- `apps/web/app/cxc-ai/layout.tsx` passes `containerClassName="mr-auto max-w-[1600px] pl-6 sm:pl-12"` so the cxc-ai shell anchors flush-left with `~48px` of left padding instead of the old `~88px` `mx-auto` gap (halfway between the original position and the wall, per the user's spec).
- `apps/web/features/cxc-ai/index.ts` updated to export the new components; `message-composer.tsx` and `source-pill.tsx` deleted (their roles are now filled by `PromptInput` and `CitationBubble`).

### What we ported vs skipped

| Architecture concept | Status in CXC |
| --- | --- |
| `useChat` from `@ai-sdk/react` + `DefaultChatTransport` | Already present (Wave 5). |
| Centered empty-state with inline prompt → sticky bottom composer | **Ported.** |
| Stream status icons (Loader2 / Square / X / ArrowUp) | **Ported** in `PromptInput`. |
| Compact rounded user bubbles, prose assistant messages | **Ported.** |
| Stick-to-bottom scrolling | Auto-scroll-to-bottom via `tailRef.scrollIntoView`. (No `use-stick-to-bottom` package; not in deps.) |
| Tool grouping into "Chain of thought" with collapsible steps | **Ported** via `ToolChain`. |
| Citation hover bubbles with on-demand fetch | **Ported** as `CitationBubble`. Sources are already in the message parts so no extra fetch is needed (Haleum needs the round-trip because evidence is heavyweight; ours is already small). |
| Sidebar grouped by Today / Last 7 Days / Older | **Ported** in `ChatHistoryRail`. |
| Markdown rendering for assistant text | **Ported** as zero-dep `Markdown` component (paragraphs, lists, bold, inline code, autolinks). |
| Mastra agent runtime, multi-step `maxSteps: 15`, sub-agent threads, Daytona sandboxes, Redis resumable streams, OpenRouter/Bedrock/Anthropic registry | **Skipped** — out of scope for CXC. We use raw AI SDK with OpenAI directly, no Mastra, no Daytona, no Redis. The architecture itself notes those layers are problem-specific to a security investigation chatbot. |
| `Task` sub-agent UI | **Skipped** — no sub-agents in our agent. |
| Code execution / chart rendering | **Skipped** — no code execution tool. |

### Verification

- `pnpm typecheck` → green (web rebuild from cache miss, all four workspaces successful).
- `pnpm lint` → green with `--max-warnings=0`.
- Streaming: `POST /api/cxc-ai` (id=`final-verify`, prompt: "How do I sign up for housing draws?") emitted `text-start` / `text-delta` / `text-end` / `[DONE]`.
- Persistence: `GET /api/cxc-ai/chats/final-verify` returned the user + assistant turns, title auto-derived from the question.
- Screenshots:
  - Empty state: `/tmp/cxc-screens/empty-state.png` — centered "How can I help?" with autoFocused inline prompt, content anchored ~48px from left wall.
  - Thread: `/tmp/cxc-screens/final-thread.png` — compact cardinal-red user bubble, prose assistant message, sticky composer with ArrowUp button, sidebar grouped under "Today".

## Pass 4 — Stop skipping the architecture (`ai-chatbot-architecture.md`, real port)

User pushed back on Pass 3's "Skipped" column: only **Daytona Sandbox** is genuinely out of scope. Everything else needed to be implemented, even if the underlying infra (Mastra framework, Redis, multi-provider deps) had to be replaced with leaner equivalents that achieve the same flow.

### Sub-agent fan-out (parallel)

- **Agent A** (model registry + Task tool + step bump):
  - NEW `apps/web/server/cxc-ai/agents/model-registry.ts` — `getModel("chat-agent" | "research-subagent" | "title")` and `getModelName(...)`. OpenAI-only today, but the switch is structured so adding Anthropic/Bedrock is one config row + one case.
  - NEW `apps/web/server/cxc-ai/agents/research-subagent.agent.ts` — narrower system prompt, `stepCountIs(8)`, single-tool toolset (`search_cxc_sources` only).
  - NEW `apps/web/server/cxc-ai/agents/tools/task.tool.ts` — exports `deriveSubagentThreadId` (`subagent-${toolCallId}`) and `createTaskTool({ parentChatId })`. The tool reads `toolCallId` from the AI SDK v6 `ToolExecutionOptions` second arg, ensures a sub-thread session, runs `streamText` with the research sub-agent's prompt + tools + `stepCountIs(8)`, awaits `result.text`, persists `[user, assistant]` under the sub-thread id, and returns `{ subThreadId, synthesis }`.
  - EDIT `apps/web/server/cxc-ai/agents/cxc.agent.ts` — `cxcAiStopWhen` `stepCountIs(3)` → `stepCountIs(15)` (matches Haleum's `maxSteps: 15`); `cxcAiModelName` now sourced from `getModelName("chat-agent")`; `createCxcAiTools({ chatId })` conditionally wires the `Task` tool when `chatId` is provided.
- **Agent B** (`[H#]` citations):
  - NEW `apps/web/server/cxc-ai/services/citation-extraction.service.ts` — `parseCitationToken`, `extractCitationRanges`, `citedSourceIndices`. Handles `[H1]`, `[H1, H4]`, `[H4-H6]`, `[H1, H4-H6, H8]`. Pure server utilities, no I/O.
  - NEW `apps/web/features/cxc-ai/components/cited-text.tsx` — `CitedText({ text, sources, className })` walks the ranges, splitting text into `<Markdown>` slabs interleaved with inline `<CitationBubble>` chip groups. Out-of-range tokens (e.g. `[H99]` when only 5 sources) render as muted plain text, never broken chips.
- **Agent C** (resumable streams):
  - NEW `apps/web/server/cxc-ai/services/stream-registry.ts` — module-scoped `Map<chatId, RegisteredStreamInternal>` plus a `TransformStream` that fans out: forwards to original consumer, appends to an in-memory buffer, broadcasts sliced chunks to late-joiners. `flush()` flips `done`, closes joiners, schedules a 60s TTL, and a single timer is cleared/replaced on overwrite.
  - NEW `apps/web/app/api/cxc-ai/chats/[chatId]/stream/route.ts` — `GET` returns `204` if no active stream, else `200 text/event-stream` with `attach()` replay+forward. Header `x-vercel-ai-ui-message-stream: v1` matches the POST endpoint so AI SDK clients treat it identically.

### Integration (me)

- `apps/web/server/cxc-ai/services/chat.service.ts`:
  - Threads `chatId` into `createCxcAiTools({ chatId })` so the Task tool is wired on the main agent.
  - Wraps the response body via `registerStream(chatId, response.body)` so the GET stream endpoint can replay+forward chunks within the 60s TTL window.
  - `onFinish` (and the fallback path) now extract the final assistant text via `extractFinalAssistantText` and pass it to `persistFinishedTurn`. The persistence step calls `citedSourceIndices(text)` and **filters the persisted source list to only the cited indices** when `[H#]` tokens are present, keeping the full retrieval set when no citations were emitted (preserves backward compatibility).
- `apps/web/server/cxc-ai/agents/prompts/system.prompt.ts`:
  - Updated persona to teach the model the `[H1]`, `[H4-H6]` citation format and to use parallel tool calls + the Task tool when the question has independent sub-topics.
  - `formatSourcesForPrompt` now numbers sources `[H1]`, `[H2]`, … so the model can cite them by token rather than by name.
- `apps/web/features/cxc-ai/components/message-list.tsx`:
  - Assistant text now renders through `<CitedText>` (Markdown + inline `[H#]` chips) instead of plain `<Markdown>`. Tool parts still flow through `ToolChain`. Source list at the bottom remains for sources that weren't inline-cited.
- `apps/web/features/cxc-ai/hooks/use-stick-to-bottom.ts`:
  - NEW small hook (no package) that tracks whether the scroll element is within 64px of the bottom; auto-scrolls only when the user is already near the bottom so reading mid-thread doesn't yank.
- `apps/web/features/cxc-ai/components/chat-shell.tsx`:
  - Replaced the plain `scrollIntoView` with `useStickToBottom`. When the user has scrolled away, a small floating "ArrowDown" button appears at `sticky bottom-4` so they can jump back. Auto-scroll only fires on new messages while at-bottom.

### What we ported vs what stays skipped

| Architecture concept | Status |
| --- | --- |
| AI SDK frontend (`useChat`, `DefaultChatTransport`) | Already present (Wave 5). |
| Centered empty state → sticky composer | Pass 3. |
| Stream status icons in submit button | Pass 3 (`PromptInput`). |
| Compact rounded user bubbles, prose assistant messages | Pass 3. |
| Markdown rendering | Pass 3 (zero-dep `Markdown`). |
| Sidebar grouped by Today / Last 7 Days / Older | Pass 3 (`ChatHistoryRail`). |
| Tool grouping into "Chain of thought" | Pass 3 (`ToolChain`). |
| Citation hover bubbles | Pass 3 (`CitationBubble`). |
| **Multi-step agent loop (`maxSteps: 15`)** | **Pass 4** (`stepCountIs(15)`). |
| **Logical model registry** | **Pass 4** (`model-registry.ts`). |
| **`Task` sub-agent tool** | **Pass 4** (`task.tool.ts` + `research-subagent.agent.ts`). Sub-thread persisted under `subagent-${toolCallId}`. |
| **`[H#]` citation tokens (extract + render inline + filter persisted sources)** | **Pass 4** (`citation-extraction.service.ts` + `cited-text.tsx`). |
| **Resumable streams (no Redis dep)** | **Pass 4** (`stream-registry.ts` + `GET /chats/[chatId]/stream`). In-memory `TransformStream`-based broadcast with 60s TTL; production swap to Redis is a one-file change. |
| **Stick-to-bottom scrolling (no `use-stick-to-bottom` package)** | **Pass 4** (`use-stick-to-bottom.ts` 25-line custom hook). |
| **Mastra framework** | Replaced with raw AI SDK that achieves the same flow (memory = Prisma `AiChatSession`/`AiChatMessage`; tool loop = `streamText` + `stopWhen`; runtime context = function arguments). No new deps. |
| Multi-provider (Anthropic/OpenRouter/Bedrock) | Registry is provider-pluggable; OpenAI is the only registered provider today. Wiring a second is one new entry + one switch case. |
| **Daytona Sandboxes / code execution / charts** | **Skipped** (per user direction — a Q&A site has no use case for code execution). |

### Verification

- `pnpm typecheck` → 4/4 successful.
- `pnpm lint` → 4/4 successful with `--max-warnings=0`.
- `POST /api/cxc-ai` (id=`port-test-1`) — streaming SSE confirmed.
- `GET /api/cxc-ai/chats/port-test-1` — persistence confirmed (user + assistant turns, title auto-derived).
- `GET /api/cxc-ai/chats/port-test-1/stream` — **resumable replay confirmed**: hit it within the 60s TTL window after the POST finished and got the same `text-start` / `text-delta` / `text-end` / `[DONE]` chunks back via `attach()`. The 200 response with `x-vercel-ai-ui-message-stream: v1` header proves the AI SDK protocol survives the resume path.
- Screenshots: `/tmp/cxc-screens/empty-state.png`, `/tmp/cxc-screens/port-final.png`.

## Pass 5 — Fallback path didn't look like a chat, looked like a log dump

User screenshot showed "hi" producing a wall of text: an extractive draft header, four `[Question: ...]`/`[Answer: ...]` paragraphs of raw snippet text, and a closing line. The Markdown renderer did its job but the input was ugly.

### Fixes

- `apps/web/server/cxc-ai/agents/cxc.agent.ts`
  - `buildFallbackAnswer` no longer interpolates `[Question: ...] snippet` blobs into the assistant text. It returns one of three short, friendly lines depending on the case (trivial greeting, no sources found, sources found). Sources are surfaced as visual cards instead of raw text.
  - Added `isTrivialQuery(text)` helper (length < 4 or one of `hi/hey/hello/yo/sup/test/ping/thanks/thank you/ok/okay`).
- `apps/web/app/api/cxc-ai/route.ts`
  - Skips retrieval entirely when `isTrivialQuery(latestUserText)` so a "hi" no longer pulls 4 random threads from the DB.
- `apps/web/server/cxc-ai/services/chat.service.ts`
  - Fallback path now constructs the assistant `UIMessage` with both `source-url` parts and a `text` part, so reload renders the same card list as the live stream.
  - The `writer.write({ type: "source-url", ... })` calls now embed `{ snippet, kind }` under `providerMetadata.cxc` so the snippet survives into the persisted message parts.
- `apps/web/features/cxc-ai/components/related-questions.tsx` (NEW)
  - Card list: small Q/A/Web badge, title, line-clamped snippet, ArrowUpRight that opens the underlying thread in a new tab. Hover flips the border + title to cardinal red.
- `apps/web/features/cxc-ai/components/message-list.tsx`
  - When assistant text contains `[H#]` tokens (`citedSourceIndices(text).size > 0`) → keep the existing inline `CitationBubble` chip strip (compact, model-cited).
  - When it doesn't → render `<RelatedQuestions sources={sources} />` instead of the chip strip. Cleaner, intentional "here are related threads" UX rather than a chip rail with no inline anchor.
  - `extractSources` now reads `providerMetadata.cxc.snippet` and `.kind` so persisted messages reload with the snippet preview intact.

### End-to-end smoke

| Input | Expected | Actual |
| --- | --- | --- |
| "hi" | trivial path, no retrieval, friendly line | `Hi — CXC AI is not connected to a model provider right now…` ✓ |
| "How do I request access to a Stanford internal service?" | search returns 0 (strict AND) → friendly "couldn't find" line | ✓ |
| "access" | search returns 6 sources → friendly intro + RelatedQuestions cards | ✓ — 6 source-url parts persisted with snippet, cards rendered with title + snippet preview + open-in-new-tab arrow |

Verified: `pnpm typecheck` ✅, `pnpm lint` ✅. Screenshots: `/tmp/cxc-screens/hi-final.png` (trivial), `/tmp/cxc-screens/cards-final.png` (cards visible).

## Notes / open items

- **No model key locally.** `.env`'s `OPENAI_API_KEY` is empty, so the live exercise was the fallback path. The AI path was reviewed structurally (`streamText` → `toUIMessageStream` → `onFinish` → `persistFinishedTurn`) but cannot be live-tested in this environment without setting a key.
- **Pre-existing "New CXC AI chat" rows in the rail.** The chat history rail shows ~20 rows from earlier wave tests where sessions were created without a first user message landing. These are real DB rows; the brief says don't seed and don't reset. Left in place. Future cleanup is a DB concern, not a feature concern.
- **No shared-shell changes needed.** The `PageShell` already supports `secondaryRail` and `sideRail={null}`, so this page's layout doesn't need any `packages/ui` or shell edits.
