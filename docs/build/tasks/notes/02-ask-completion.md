# Task 02 — Ask a Question (`/ask`) Completion Note

## What changed (in scope)

- `apps/web/app/(forum)/ask/page.tsx` — dropped the `Back to questions`
  breadcrumb (not in the canonical image), rewrote the subtitle to match
  the image copy verbatim, and the page wrapper is now `w-full` (no inner
  max-width / mx-auto) so the form fills the new full-width main column.
- `apps/web/features/ask/components/ask-form.tsx` — full rewrite of the
  form to match the canonical panel:
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
  - Bottom action row: `Cancel` (square outlined link to `/questions`) on
    the left, `Submit Question` (cardinal red) on the right, separated from
    the fields by a 1px top divider.
  - Empty-body validation message updated to `Details are required.`
- `apps/web/app/(forum)/ask/loading.tsx` — rewrote the skeleton to match the
  new layout (no breadcrumb, header + 3 fields + Cancel/Submit row,
  `w-full` wrapper to mirror the live page).

## Out-of-scope shell pieces (all shipped by coordinator)

- White top bar with cardinal-red `S` mark + cardinal-red wordmark.
- Magnifying-glass search icon.
- Cardinal-red `Ask Question` button.
- Rail with 5 items + icons in 3 sections separated by visible divider lines,
  sticky positioning, `Ask` highlights when on `/ask`.
- No right `SideRail` on forum routes.
- Inter is the only font; `font-serif` aliases to Inter.
- Brighter cardinal red (`#C8102E`).
- Forum container: `mx-auto max-w-[1600px] px-4 sm:px-6`,
  `mainMaxWidthClass="max-w-none"`, `sideRail={null}`.
- Tailwind v4 spacing + border-radius regressions fixed (gap/m/p/space and
  rounded-* utilities now produce CSS).

## Image element → what is implemented

| Image (top-right panel) | Current `/ask` |
| --- | --- |
| White top bar with `S` badge + cardinal wordmark | Live (shell). |
| Search input + magnifier icon | Live (shell). |
| Cardinal-red `Ask Question` button | Live (shell). |
| Rail: Home / Questions / Ask (active) / CXC AI / Tags | Live (shell). |
| `Ask a Question` heading | `<h1>` Inter, `text-3xl sm:text-4xl`, ink-900. |
| Subtitle copy | "Get help from the Stanford community by asking a clear, detailed question." |
| Title input, square + 1px border, focus ring | `h-10` rounded-md input, cardinal-red focus ring. |
| Title helper | "Be specific and imagine you're asking a question to another person." |
| Details label + rich-text toolbar | Toolbar inside the same bordered card as the textarea, vertical separators between groups, all icons match the image silhouettes (inline SVGs, no new deps). |
| Multiline body textarea + placeholder | `min-h-56` textarea, placeholder "Provide all the details someone would need to answer your question. Include context, what you've tried, relevant examples, and any error messages." |
| Tags input with example | `Add up to 5 tags (e.g. eduroam, access, dataviz)` placeholder + chip pills when committed. |
| Tags helper line | "Use specific tags to help others find your question." |
| Cancel + Submit Question row | `Cancel` Link (secondary, square) on the left, `Submit Question` button (cardinal red) on the right, 1px top divider above. |

## Verification

- `pnpm typecheck` — ✓ (turbo: 4/4 successful).
- `pnpm lint` — ✓ (turbo: 4/4 successful, eslint --max-warnings=0).
- Real submission via the form (1440×900 viewport, post-shell update):
  filled `Title`, `Details`, two tags via Enter, clicked
  `Submit Question`. Browser landed on
  `/questions/how-do-i-sign-up-for-the-stanford-vpn-with-my-sunet-id`,
  the row + both tag rows present in Postgres:

  ```
  slug:  how-do-i-sign-up-for-the-stanford-vpn-with-my-sunet-id
  title: How do I sign up for the Stanford VPN with my SUNet ID?
  tags:  vpn, library
  ```

- Bold-button regression (still good): selected `this` inside
  `make this bold please` and clicked **B** → textarea value
  `make **this** bold please`.
- Screenshots:
  - `docs/build/tasks/notes/02-ask-screenshot.png` — empty form, 1440×900.
  - `docs/build/tasks/notes/02-ask-screenshot-filled.png` — filled form,
    1440×900, with tag chips visible.

CONVERGED
