# 03 · Frontend

Brief for the **Frontend Agent**. Owns `apps/web/app` (route tree) and `apps/web/frontend/features`. Calls backend only through route handlers / server actions and uses tokens + primitives from `04-design.md` and `@cardinalxchange/ui`.

## Image — re-open before each panel

`file:///Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

Build the four panels exactly as shown. The only intentional deviation: panel 3 supports a list of multiple answers.

## Shared Page Shell

All four panels share:

- **Top command bar** (`features/shell/components/top-command-bar.tsx`)
  - Left: `CardinalXchange` wordmark in cardinal red.
  - Center: search input, full-width on the available track. Square corners, 1px border.
  - Right: `Ask Question` button (cardinal red, square corners, white text, slightly larger title-case label only — buttons are not titles, so square).
- **Left rail** (`features/shell/components/topic-rail.tsx`)
  - Items in order: `Home`, `Questions`, `Tags`, `CXC AI`. Active item: cardinal-red left bar, bold label.
  - Compact, `rounded-md` hit targets allowed (square is also fine), no curved pills. (Updated from initial brief: rounded-md is now permitted on rail items, search input, primary buttons, filter tabs, and side-rail cards per user direction.)
- **Content track**
  - Centered, max-width readable column.
  - Generous vertical rhythm; tight horizontal density on rows.

`features/shell/components/page-shell.tsx` composes top bar + left rail + a `<main>` slot.

## Panel 1 — Questions List (`/questions`)

Route: `app/questions/page.tsx`. Server component; fetches via `server/questions.service.listQuestionsForFeed`.

Components:
- `features/questions/components/question-feed.tsx` — list container, empty state, optional sort/filter chips.
- `features/questions/components/question-row.tsx` — title (link), 1–2 line snippet, tag list, meta line (`asked by … · N answers · time`).

Empty state (no seed data — empty DB is the default in dev):

> `No questions yet. Be the first — Ask a Question.` with a square `Ask Question` button.

Behavior:
- Title click → `/questions/[id]`.
- Tag click → `/questions?tag=<slug>`.

## Panel 2 — Ask a Question (`/ask`)

Route: `app/ask/page.tsx`. Client component for the form, server action for submit.

Components:
- `features/ask/components/ask-form.tsx`
  - Fields: `Title` (text input), `Body` (textarea, monospace-friendly, multiline), `Tags` (chip input — comma or enter to commit a tag).
  - Submit posts to `POST /api/questions`. On success, route to `/questions/[id]`.
- Validation surfaces inline errors from `server/http/inputs.createQuestionInput` Zod schema via the contract types.

Square corners on inputs, 1px border, focus ring is a 2px cardinal-red outline.

No drafts, no autosave — drafts die on navigation per architecture doc.

## Panel 3 — Question Detail (`/questions/[questionId]`) — supports multiple answers

Route: `app/questions/[questionId]/page.tsx`. Server component.

Components:
- `features/questions/components/question-detail.tsx`
  - Header: title, tags, meta.
  - Body: full markdown-rendered question body.
- `features/questions/components/answer-list.tsx`
  - Renders **all** answers in `createdAt asc` order.
  - Each item: author display, timestamp, body. Subtle divider between items.
  - Empty state: `No answers yet. Add the first one below.`
- `features/questions/components/answer-composer.tsx`
  - Textarea + `Post Answer` button. Posts to `POST /api/questions/[id]/answers`.
  - On success, append the new answer to the list (server-revalidate or client cache update).

This is the only panel that diverges from the image: the image shows one answer; build a list.

## Panel 4 — CXC AI (`/cxc-ai` and `/cxc-ai/[chatId]`)

Route: `app/cxc-ai/page.tsx` for new chat, `app/cxc-ai/[chatId]/page.tsx` for resume.

Components:
- `features/cxc-ai/components/chat-shell.tsx` — left rail collapses to icons here if needed, but the same shell is used.
- `features/cxc-ai/components/message-list.tsx` — assistant + user bubbles; assistant messages render source pills.
- `features/cxc-ai/components/source-pill.tsx` — square pill, 1px border, label like `Q · How do I…`. Clicking opens the underlying `/questions/[id]` in a new tab.
- `features/cxc-ai/components/message-composer.tsx` — textarea + `Send`. Streams via Vercel AI SDK to `/api/cxc-ai`.
- `features/cxc-ai/hooks/use-cxc-chat.ts` — wraps AI SDK `useChat` with our DTOs.

Behavior:
- New chat creates a session on first send; URL replaces to `/cxc-ai/[chatId]`.
- `Ask the Community` tool result renders an inline draft card with `Use this draft` button → routes to `/ask?draft=…` carrying transient state. No DB write until user explicitly posts.

## State

- Server components for reads. `useTransition` + `router.refresh()` for invalidations.
- No global client store. Per-feature hooks only.
- Form state in components, not in a store.

## Data Flow Diagram

```
app/<route>/page.tsx          (server component)
  └─ calls @/backend/<feature>.service
        └─ calls @cardinalxchange/db query helpers

app/api/<route>/route.ts      (route handler)
  └─ parse @/backend/http/inputs
  └─ call @/backend/<feature>.service
  └─ jsonOk / jsonError
```

Frontend never imports `@cardinalxchange/db`. Frontend imports DTO types from `@/backend/http/contracts`.

## Loading & Error States

Each route owns `loading.tsx` and `error.tsx`. Skeletons match the row/card geometry — square placeholders, no shimmering gradients (looks AI).

## Empty States (no seed data, ever)

- `/questions` — `No questions yet.`
- `/questions/[id]` answer list — `No answers yet.`
- `/cxc-ai` — `Ask anything about Stanford. CXC AI cites public Q&A when it can.`

## Accessibility

- Focus ring on every interactive element; never remove outline without replacement.
- Labels associated with inputs via `htmlFor`.
- Live region announces new answers and new assistant messages.

## Completion Note

```
## Completion Note
- What changed: 
- Open questions for next agent: 
- Image cross-check: 
```
