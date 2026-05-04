# 01 — Questions list page: completion note

Owner: top-left panel of the canonical 2×2 image. Re-verified after the
shell pass landed (white top bar + red `S` mark, magnifier in search,
brighter `#c8102e` cardinal, Inter-only typography, 5-item rail with
icons in order Home / Questions / Ask / CXC AI / Tags, no right side
rail on forum routes).

## Files changed

- `apps/web/app/(forum)/questions/page.tsx` — replaced pill-button
  filter row with underline tabs sitting on a hairline divider. The
  active filter label reads `Answered` to match the canonical
  (server `FeedSort` keys are unchanged so `?sort=active` still
  works). Page heading is now `text-4xl/5xl font-bold tracking-tight`
  Inter — dropped the legacy `font-serif` class since the shell pass
  removed Source Serif 4 and Inter is the only family.
- `apps/web/features/questions/components/question-row.tsx` — two
  column layout. Left column: cardinal-red title (`text-cardinal-500`,
  hover `cardinal-600`), ink-700 snippet `line-clamp-2`, hairline tag
  pills (`rounded-sm border-default px-2 py-0.5 text-xs ink-500`).
  Right column: `w-40` right-aligned, top line `X answers`
  (`text-sm font-medium ink-900`), bottom line
  `<author> · <askedAt>` (`text-xs ink-500 whitespace-nowrap`,
  author bolded ink-700).
- `apps/web/features/questions/components/question-feed.tsx` —
  dropped the outer 1px card wrapper around the row stack so rows
  flow flush in the main column with `divide-y divide-border-default`
  hairlines. Empty-state branch keeps a card frame and gained `mt-6`
  to compensate for the lost outer margin.
- `apps/web/app/(forum)/questions/loading.tsx` — skeleton rebuilt to
  match the live layout (no card frame, two-column row skeletons,
  underline-tab skeleton row). Drives the same hairline divider.

In scope but unchanged: `apps/web/app/(forum)/page.tsx` (still just
`redirect("/questions")`) and `apps/web/app/(forum)/questions/error.tsx`.

## Side-by-side: canonical → built

| Canonical element | Final state in build |
|---|---|
| Bold display `Questions` heading | `h1` with `text-4xl sm:text-5xl font-bold tracking-tight` Inter |
| Filter tabs: text-only, active = red label + red underline, hairline rule under the row | `<nav class="border-b border-default">` with each tab `h-10 -mb-px border-b-2`; active `border-cardinal-500 text-cardinal-500`, inactive `border-transparent text-ink-500 hover:text-ink-900` |
| Question title in cardinal red | `text-[var(--color-cardinal-500)]` (hover `cardinal-600`) |
| Snippet 1–2 lines, mid gray | `text-sm leading-snug text-ink-700 line-clamp-2` |
| Tag pills: hairline gray border, near-square, x-small label | `rounded-sm border-default px-2 py-0.5 text-xs ink-500` (hover cardinal) |
| Right column: `X answers` over `author · time`, right-aligned | `w-40 flex-col items-end text-right`, top `text-sm font-medium ink-900`, bottom `text-xs ink-500 whitespace-nowrap` |
| Hairline rule between rows, no outer card | `<ul class="divide-y divide-border-default">` with no wrapping border |
| No right side rail on forum routes | Honoured by shell update; main column expands to `max-w-4xl` cap with empty gutter at 1440px |

## Verification

- `pnpm typecheck` — green (Tasks: 4 successful, 4 total).
- `pnpm lint` — green (Tasks: 4 successful, 4 total).
- `/browse` screenshots:
  - `docs/build/tasks/notes/01-questions-screenshot-1440.png` (1440×900)
  - `docs/build/tasks/notes/01-questions-screenshot-900.png` (900×900,
    matches the canonical panel aspect closely)
- Compared side-by-side against the top-left panel of
  `/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`.
  Top bar, rail, heading, filter tabs, row layout, title color, tag
  pills, and right-meta block all match. The "qqq / **VAA**" entry is
  raw markdown leftover from QA seed data, not a layout issue.

CONVERGED
