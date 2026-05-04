# Task 04 — CXC AI Chat (`/cxc-ai` and `/cxc-ai/[chatId]`)

You own the **bottom-right panel** of the canonical image, AND making the AI SDK actually work end-to-end.

`/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

**Read the image first.** Look at the bottom-right panel.

## Read the shared brief

`docs/build/tasks/SHARED-CONTEXT.md` — rules, scope, verification, tone.

## Your scope

- `apps/web/app/cxc-ai/page.tsx`
- `apps/web/app/cxc-ai/[chatId]/page.tsx`
- `apps/web/app/cxc-ai/layout.tsx`
- `apps/web/app/cxc-ai/loading.tsx`
- `apps/web/app/cxc-ai/error.tsx`
- Components under `apps/web/features/cxc-ai/components/`:
  - `chat-shell.tsx`
  - `message-list.tsx`
  - `message-composer.tsx`
  - `source-pill.tsx`
  - `chat-history-rail.tsx`
- Hook: `apps/web/features/cxc-ai/hooks/use-cxc-chat.ts`
- API route: `apps/web/app/api/cxc-ai/route.ts` (you may edit; this is part of "make the AI SDK actually real")
- Server services: `apps/web/server/cxc-ai/services/chat.service.ts`, `retrieval.service.ts`, `web-context.service.ts` (you may edit)
- Agents and prompts: `apps/web/server/cxc-ai/agents/` (you may edit)

DO NOT touch other features' components, `packages/db`, `packages/ui`, or the forum pages.

## What the image shows (bottom-right panel)

Inspect carefully:

- Same shared top bar
- **Two left rails** (per recent user direction): the standard TopicRail + a chat history rail (shows past sessions)
- **No right side rail** on `/cxc-ai`
- **Wide main chat surface** (full-width main column)
- Page title region: "CXC AI" heading + brief subline
- **Message list**: alternating user / assistant messages; user right-aligned or distinct, assistant left-aligned
- **Source pills** under or beside assistant messages when retrieval was used (square or hairline rounded; show source title and link)
- **Composer** sticky at the bottom: large textarea + cardinal-red Send button. While streaming, Send becomes Stop.

## "Make the AI SDK actually real"

The user explicitly called this out. Right now the route streams via Vercel AI SDK and persists via the new server-side `streamCxcAiTurn` (Wave 5 fix). Verify:

1. `OPENAI_API_KEY` flow:
   - If `.env` has `OPENAI_API_KEY`, the route should call OpenAI (model defaults to `gpt-5-mini` or `OPENAI_MODEL` env override) via `@ai-sdk/openai` + `streamText` from `ai`.
   - If `OPENAI_API_KEY` is missing, the chat service must degrade to an extractive answer assembled from `searchInternalContext` results — don't 500.
2. Streaming actually streams tokens to the client (no buffered single response).
3. Persistence happens server-side in `streamCxcAiTurn`'s `onFinish` — confirm by closing the tab mid-stream and re-opening; the assistant message should still be saved.
4. `Ask the Community` tool (defined in `agents/prompts/ask-the-community.prompt.ts`) returns a transient draft `{ title, body, tags }`. The UI renders it as an inline card with "Use this draft" → routes to `/ask?draft=<encoded>`. **Never writes to DB.**
5. Source labels: assistant messages that used retrieval results get `AiChatSource` rows; the UI renders them as pills under or near the message. Click on `question` / `answer` source → opens `/questions/<id>` in a new tab. `web` source → opens the URL.

## What is currently wrong

Open `http://localhost:3000/cxc-ai` and try sending a message:
- If no API key: confirm fallback works
- If API key set: confirm streaming works, sources surface

Compare visual layout to the image panel. Likely drift:
- Message bubble styling (user vs assistant)
- Composer height / button placement
- Source pill positioning
- Empty-state copy on a fresh chat (no past chats)
- Chat history rail width / item rendering / active state

## Backend contract

- DTOs: `CxcMessageDto`, `CxcSourceDto`, `AskCommunityDraft`, `AiChatSnapshot`, `AiChatSession` from `@/server/http/contracts`
- `useCxcChat` (in `hooks/use-cxc-chat.ts`) wraps Vercel AI SDK's `useChat`
- Stream endpoint: `POST /api/cxc-ai`
- Resume snapshot: `GET /api/cxc-ai/chats/[chatId]`
- Persistence: server-side via `streamCxcAiTurn`

## Hard rules

- **Image is law for layout.**
- **AI keys are server-only.** Never expose `OPENAI_API_KEY` to the client.
- **Retrieval scope is locked**: `searchInternalContext` only reads public `Question` and `Answer` rows. Do not extend it to private chat history, drafts, or auth data.
- **Ask the Community is transient.** Never writes to DB.
- **No new dependencies.** AI SDK and `@ai-sdk/openai` are already in `package.json`.
- **Do not edit shared shell or `packages/ui/**`** — flag in `docs/build/tasks/notes/04-cxc-ai-shared-needs.md`.
- **Allowed shapes:** rectangular with `rounded-md` or square. Cardinal red is the only accent.

## Verification

1. `pnpm typecheck`, `pnpm lint`, `pnpm build` — all green
2. Visit `http://localhost:3000/cxc-ai`
3. Send a message — verify streaming (look at the response token-by-token)
4. Refresh — message persists
5. Close tab mid-stream (open and close quickly), then re-open the chat URL — assistant message should still be there
6. Without `OPENAI_API_KEY` (temporarily comment it out, restart server) — verify extractive fallback works and the page does not 500
7. Screenshot the chat surface, compare to bottom-right image panel

## Sub-agents

You may launch sub-agents (e.g., one for the layout polish, one for the streaming verification, one for the persistence test).

## Completion note

`docs/build/tasks/notes/04-cxc-ai-completion.md` — same format. Be specific about which AI behaviors you exercised.
