# CXC AI Rail Implementation

Refactor the `/cxc-ai/*` routes to use two left-side rails (`TopicRail` +
`ChatHistoryRail`) and no right-side rail, with a wide chat surface.
Forum routes (`/`, `/questions`, `/questions/[id]`, `/ask`) keep the
default shell. Achieved with Next.js App Router segment layouts.

## Files moved (`git mv`)

| From | To |
| --- | --- |
| `apps/web/app/page.tsx` | `apps/web/app/(forum)/page.tsx` |
| `apps/web/app/ask/error.tsx` | `apps/web/app/(forum)/ask/error.tsx` |
| `apps/web/app/ask/loading.tsx` | `apps/web/app/(forum)/ask/loading.tsx` |
| `apps/web/app/ask/page.tsx` | `apps/web/app/(forum)/ask/page.tsx` |
| `apps/web/app/questions/error.tsx` | `apps/web/app/(forum)/questions/error.tsx` |
| `apps/web/app/questions/loading.tsx` | `apps/web/app/(forum)/questions/loading.tsx` |
| `apps/web/app/questions/page.tsx` | `apps/web/app/(forum)/questions/page.tsx` |
| `apps/web/app/questions/ask/page.tsx` | `apps/web/app/(forum)/questions/ask/page.tsx` |
| `apps/web/app/questions/[questionId]/error.tsx` | `apps/web/app/(forum)/questions/[questionId]/error.tsx` |
| `apps/web/app/questions/[questionId]/loading.tsx` | `apps/web/app/(forum)/questions/[questionId]/loading.tsx` |
| `apps/web/app/questions/[questionId]/page.tsx` | `apps/web/app/(forum)/questions/[questionId]/page.tsx` |

API routes under `apps/web/app/api/**` were intentionally left in place.

## Files created

- `apps/web/app/(forum)/layout.tsx` — wraps the forum group in the default
  `<PageShell>` (TopicRail + 720px main + SideRail).
- `apps/web/app/cxc-ai/layout.tsx` — server layout that loads
  `listAiChatSessions()` and renders `<PageShell>` with the new
  `secondaryRail` slot, `sideRail={null}`, and `mainMaxWidthClass="max-w-none"`.
- `apps/web/features/cxc-ai/components/chat-history-rail.tsx` — the new
  client-component rail (`"use client"` for `usePathname`) with a `New chat`
  button, a recent-sessions list (sorted by `updatedAt`), active-item
  highlight matching `TopicRail`, relative timestamps, and an empty state.

## Files modified

- `apps/web/features/shell/components/page-shell.tsx` — added
  `secondaryRail`, `sideRail`, and `mainMaxWidthClass` props; backwards
  compatible (no props = current default shell).
- `apps/web/app/layout.tsx` — slimmed to fonts/metadata/`<body>{children}</body>`;
  removed the global `<PageShell>` wrap.
- `apps/web/features/cxc-ai/components/chat-shell.tsx` — outer wrapper now
  `flex w-full flex-col gap-4 px-6 py-6 sm:px-8` (dropped `mx-auto max-w-4xl`)
  and conversation surface bumped from `min-h-[24rem]` to `min-h-[40rem]`.
- `apps/web/features/cxc-ai/index.ts` — exports `ChatHistoryRail`.

## Layout tree (after refactor)

```
app/
  layout.tsx                 # html/body, fonts, metadata only
  page.tsx                   # (forum)/page.tsx — redirect → /questions
  (forum)/
    layout.tsx               # PageShell (default: TopicRail + 720px + SideRail)
    page.tsx
    ask/
      error.tsx loading.tsx page.tsx
    questions/
      error.tsx loading.tsx page.tsx
      ask/page.tsx
      [questionId]/
        error.tsx loading.tsx page.tsx
  cxc-ai/
    layout.tsx               # PageShell(secondaryRail=ChatHistoryRail, sideRail=null, mainMaxWidthClass="max-w-none")
    error.tsx loading.tsx page.tsx
    [chatId]/page.tsx
  api/
    cxc-ai/...               # unchanged
    questions/...
    search/route.ts
```

## Verification

| Check | Command | Status |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | exit 0 |
| Lint | `pnpm lint` | exit 0 |
| Build | `pnpm build` | exit 0 |

`pnpm build` lists all expected routes:
`/`, `/ask`, `/cxc-ai`, `/cxc-ai/[chatId]`, `/questions`, `/questions/[questionId]`,
`/questions/ask`, plus the `/api/*` handlers.

## Visual QA (browse, viewport 1440×900)

Dev server was restarted (`pnpm dev`) so Turbopack picked up the new layout
tree. All routes returned HTTP 200 with no console errors after navigation.

| Path | Result |
| --- | --- |
| `/` | redirects to `/questions` |
| `/questions` | TopicRail (active=Questions) + SideRail (About + Tags). 200, no console errors. |
| `/ask` | TopicRail (active=Questions) + SideRail. 200, no console errors. |
| `/cxc-ai` | TopicRail (active=CXC AI) + ChatHistoryRail with `New chat` + Recent list. No SideRail. Wide chat surface, taller min-height. 200, no console errors. |
| `/cxc-ai/[chatId]` | Same shell; the matching session in ChatHistoryRail shows the cardinal-red left bar and bold title. 200, no console errors. |

Screenshots:

- `/tmp/qa-questions2.png` — fully loaded questions feed with default shell.
- `/tmp/qa-ask.png` — ask form with default shell.
- `/tmp/qa-cxc-ai.png` — CXC AI index with two left rails, no right rail.
- `/tmp/qa-cxc-ai-chat.png` — CXC AI chat detail with active history item.

(Question detail not screenshotted — DB is empty, so no question slug exists
to visit. The route compiles and is registered in the build manifest.)

## Open questions

- `ChatHistoryRail` currently uses `usePathname` to compute the active state,
  so it ships as a client component. The plan allowed for either approach
  ((a) client wrapper or (b) server with `activeChatId` prop) and (a) was
  chosen for simplicity. If we later want to render the rail entirely on the
  server, the layout could parse `params` and pass an `activeChatId` prop
  down — at the cost of an extra server prop drill.
- Session list ordering uses `updatedAt` (DTO has both `updatedAt` and
  `createdAt`). The current store doesn't bump `updatedAt` on every send,
  so older sessions can sometimes appear at the top until a write lands;
  this is a backend concern, not a rail concern.
- Empty DB is canonical, but with developer activity the rail can grow tall.
  No internal scrolling was added (the page already scrolls); if the rail
  needs to stay viewport-pinned later, wrap the `<ul>` in an
  `overflow-y-auto` container with `sticky top-0`.
