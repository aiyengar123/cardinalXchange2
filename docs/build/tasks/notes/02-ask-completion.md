# Task 02 — Ask a Question (`/ask`) Completion Note

## What changed (in scope)

- `apps/web/app/(forum)/layout.tsx` — switched the route-group `PageShell`
  config to `containerClassName="mr-auto max-w-[1600px] pl-6 sm:pl-12"` so
  the rail anchors to the left of the viewport at wide widths instead of
  drifting toward the centre. This matches the Stack Overflow whitespace
  gap the user asked for and aligns this group with the existing `/cxc-ai`
  layout. (`(forum)/layout.tsx` is the route-group config that selects
  `PageShell` props — `PageShell` itself is untouched.) Verified `/questions`
  still renders correctly with the new container.
- `apps/web/app/(forum)/ask/page.tsx` — dropped the `Back to questions`
  breadcrumb (not in the canonical image) and rewrote the subtitle to match
  the image copy verbatim.
- `apps/web/features/ask/components/ask-form.tsx` — full rewrite of the form
  to match the canonical panel:
  - Title placeholder + helper copy match the image.
  - "Body" → **Details** label, with a markdown toolbar (Bold, Italic, Inline
    code, Link, Bulleted list, Numbered list, Undo, Redo) wrapping the
    textarea inside a single bordered, rounded-md card. Toolbar buttons fire
    on `mouseDown` with `event.preventDefault()` so the textarea keeps focus
    and the user's selection survives the click — selecting "this" in
    `make this bold please` and clicking **B** now produces
    `make **this** bold please`.
  - Tags: cap dropped from 8 → 5; placeholder
    `Add up to 5 tags (e.g. eduroam, access, dataviz)`; helper
    `Use specific tags to help others find your question.`
  - Bottom action row: `Cancel` (square outlined link to `/questions`) on the
    left, `Submit Question` (cardinal red) on the right, separated from the
    fields by a 1px top divider.
  - Empty-body validation message updated to `Details are required.`
- `apps/web/app/(forum)/ask/loading.tsx` — rewrote the skeleton to match the
  new layout (no breadcrumb, header + 3 fields + Cancel/Submit row).

## Out-of-scope shell pieces

The earlier shared-shell items shipped (logo `S` badge, search placeholder,
rail items + active state, no right SideRail, brighter cardinal red, single
Inter font stack).

One residual top-bar alignment issue is now logged in
`02-ask-shared-needs.md`: at 1440+ viewports the top-command-bar wordmark
sits ~50–300px right of the rail because the bar still uses
`mx-auto max-w-[1264px]` while the forum row uses
`mr-auto max-w-[1600px] pl-6 sm:pl-12`. Fix is in
`top-command-bar.tsx` (shared shell).

## Image element → what is implemented

| Image (top-right panel) | Current `/ask` |
| --- | --- |
| White top bar with `S` badge + cardinal wordmark | Live (shell). |
| Search input + magnifier icon | Live (shell). |
| Cardinal-red `Ask Question` button | Live (shell). |
| Rail: Home / Questions / Ask (active) / CXC AI / Tags | Live (shell), now anchored left. |
| `Ask a Question` heading | `<h1>` in Inter, `text-3xl sm:text-4xl`, ink-900. |
| Subtitle copy | "Get help from the Stanford community by asking a clear, detailed question." |
| Title input, square + 1px border, focus ring | `h-10` rounded-md input, cardinal-red focus ring. |
| Title helper | "Be specific and imagine you're asking a question to another person." |
| Details label + rich-text toolbar | Toolbar inside the same bordered card as the textarea, vertical separators between groups, all icons match the image silhouettes (inline SVGs, no new deps). |
| Multiline body textarea + placeholder | `min-h-56` textarea, placeholder "Provide all the details someone would need to answer your question. Include context, what you've tried, relevant examples, and any error messages." |
| Tags input with example | `Add up to 5 tags (e.g. eduroam, access, dataviz)` placeholder + chip pills when committed. |
| Tags helper line | "Use specific tags to help others find your question." |
| Cancel + Submit Question row | `Cancel` Link (secondary, square) on the left, `Submit Question` button (cardinal red) on the right, 1px top divider above. |
| Whitespace gap before rail (Stack Overflow parity) | Forum container is now `mr-auto max-w-[1600px] pl-6 sm:pl-12`. |

## Verification

- `pnpm typecheck` — ✓ (turbo: 4/4 successful).
- `pnpm lint` — ✓ (turbo: 4/4 successful, eslint --max-warnings=0).
- Real submission via the form (not curl): filled `Title`, `Details`, two
  tags via Enter, clicked `Submit Question`. Browser landed on
  `/questions/where-can-i-find-quiet-study-space-in-green-library-on-weekends`,
  row + tag rows present in Postgres.
- Bold-button regression test: selected `this` inside
  `make this bold please` and clicked **B** — textarea value became
  `make **this** bold please`.
- Screenshots after the SO-whitespace fix:
  - `/tmp/ask-1440-fixed.png` (1440×900) — committed at
    `docs/build/tasks/notes/02-ask-screenshot.png`.
  - `/tmp/ask-1920-fixed.png` (1920×1080) — rail now sits ~48px from the
    viewport edge instead of ~352px; matches the Stack Overflow reference
    the user provided.
  - `/tmp/questions-1440.png` — verified the sibling `/questions` route also
    renders correctly under the new forum layout.
