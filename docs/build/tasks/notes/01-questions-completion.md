# 01 — Questions list page: completion note

Owner: top-left panel of the canonical 2×2 image. Re-verified after the
big shell pass that fixed the missing Tailwind v4 `--spacing` token and
the global `* { border-radius: 0 }` reset. Live shell now: white top bar
(red `S` mark + cardinal-red wordmark + magnifier search + red
`Ask Question` CTA), 5-item rail with icons (Home / Questions / Ask /
CXC AI / Tags) split into three sections by visible dividers, rounded
gray pill active state, sticky positioning, vivid `#c8102e` cardinal
red, Inter-only typography, forum container `mx-auto max-w-[1600px]
px-4 sm:px-6` with `sideRail={null}` and `gap-16` between rail and
main.

## Final shape of files in scope

- `apps/web/app/(forum)/questions/page.tsx`
  - Wrapper is now `w-full` (the shell owns the max-width).
  - Heading: `h1` `text-3xl sm:text-4xl font-semibold tracking-tight`
    Inter (matches the coordinator's reduced display weight).
  - Filter row: text-underline tabs `Newest / Answered / Unanswered`
    in a `<nav>` with `border-b border-default`; active tab has
    `border-b-2 border-cardinal-500 text-cardinal-500`, inactive
    `text-ink-500 hover:text-ink-900`. Server `FeedSort` keys
    unchanged so `?sort=active` still routes correctly even though
    the displayed label is `Answered`.
  - Added `mt-4` on the wrapper around `<QuestionFeed/>` so the first
    card no longer hugs the filter row's hairline divider.
- `apps/web/features/questions/components/question-feed.tsx`
  - Stack is `<ul class="flex flex-col gap-3">`, each `<li>` is its
    own `rounded-lg border border-default bg-surface-base` card
    (the new design intent — no hairline-only list).
  - Empty-state branch keeps the card frame with `mt-6` so it does
    not collide with the filter divider.
- `apps/web/features/questions/components/question-row.tsx`
  - Card-internal padding `px-6 py-6`.
  - Left column: cardinal-red title `text-lg font-semibold`
    (hover `cardinal-600`), `text-base leading-relaxed text-ink-700
    line-clamp-2` snippet, tag pills `rounded-md border-default
    px-2.5 py-1 text-sm font-medium text-ink-500` (hover cardinal).
  - Right column: `w-44 shrink-0 flex-col items-end text-right`,
    top line `text-base font-medium text-ink-900`, bottom line
    `text-sm text-ink-500 whitespace-nowrap` with author bolded
    `text-ink-700`.
- `apps/web/app/(forum)/questions/loading.tsx`
  - Skeleton mirrors the live layout (underline-tab skeleton row,
    plain stack of two-column row skeletons).

In scope but unchanged: `apps/web/app/(forum)/page.tsx` (still
`redirect("/questions")`) and `apps/web/app/(forum)/questions/error.tsx`.

## Side-by-side: canonical → built

| Canonical element | Final state in build |
|---|---|
| Bold display `Questions` heading | `h1` `text-3xl sm:text-4xl font-semibold tracking-tight` Inter |
| Underline filter tabs `Newest / Answered / Unanswered` over a hairline rule | `<nav class="border-b border-default">` with `h-10 -mb-px border-b-2` tabs; active red, inactive ink-500 |
| Cardinal-red question title | `text-[var(--color-cardinal-500)]` `text-lg font-semibold` |
| Mid-gray snippet 1–2 lines | `text-base leading-relaxed text-ink-700 line-clamp-2` |
| Tag pills with hairline gray border | `rounded-md border-default px-2.5 py-1 text-sm text-ink-500` |
| Right column: `X answers` over `author · time`, right-aligned | `w-44 flex-col items-end text-right`, top `text-base font-medium ink-900`, bottom `text-sm ink-500 whitespace-nowrap` |
| Row separation | Coordinator pivoted from canonical's hairline-divider rows to `gap-3` rounded cards. Adopted accordingly. |
| No right side rail on forum routes | Honoured by shell (`sideRail={null}`); main expands inside `max-w-[1600px]`. |

## Possible follow-ups (not blocking convergence)

- At 1440×900 each card is very wide (`~1080px`) so a single row of
  body copy stretches further than the canonical panel suggests. This
  is a property of the shell-level `max-w-[1600px]` choice, not the
  feed itself; if a tighter reading width is wanted later the shell
  can drop the cap or the feature can introduce a feed-local
  `max-w-3xl/4xl`.
- The DB has a `qqq / **VAA**` row from earlier QA. The raw markdown
  is a content artifact, not a layout issue.

## Verification

- `pnpm typecheck` — green (Tasks: 4 successful, 4 total).
- `pnpm lint` — green (Tasks: 4 successful, 4 total).
- `/browse` screenshots (refreshed for this pass):
  - `docs/build/tasks/notes/01-questions-screenshot-1440.png` (1440×900)
  - `docs/build/tasks/notes/01-questions-screenshot-900.png` (900×900)
- Compared side-by-side against the top-left panel of
  `/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`.

CONVERGED

CONVERGED (post-shell-v3: cards-with-gap design, mt-4 added between
filter divider and feed, screenshots refreshed, typecheck/lint green)
