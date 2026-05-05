# UI Polish — three contained fixes

Branch: `ui-polish`. All changes scoped to `apps/web/frontend/features/**`. No
new dependencies. Typecheck and lint green.

## Fix 1 — Markdown polish

`apps/web/frontend/features/questions/components/markdown.tsx`

Extended the block parser (not the inline tokenizer) to support three new
block kinds while keeping inline rendering (links, bold, italic, code) inside
table cells and blockquote text. No `dangerouslySetInnerHTML`, no syntax
highlighting library — zero new deps.

- **Fenced code blocks** (```` ```lang ... ``` ````) render as
  `<pre><code class="language-<lang>">…</code></pre>` with classes
  `font-mono bg-[var(--color-surface-sunk)] rounded-md
  border border-[var(--color-border-default)] px-4 py-3 text-sm overflow-x-auto my-3`.
  Indentation and newlines preserved verbatim. The `code` tag carries the
  `language-<lang>` className when a language is provided. No highlighting.
- **Tables** with the `| col | col |` + `|---|---|` header convention render
  as a `<table>` inside a wrapper with `my-3 overflow-x-auto rounded-md
  border border-[var(--color-border-default)]`. `<thead>` row uses
  `bg-[var(--color-ink-50)] font-semibold`. `<tbody>` rows alternate via
  `even:bg-[var(--color-surface-sunk)]`. Cells are `px-3 py-2 text-sm` with
  subtle 1px borders. Header/row cell counts are normalized against the
  header so ragged rows still align.
- **Blockquotes** (consecutive lines starting with `> `) collapse into a
  single `<blockquote>` with `my-3 border-l-2 border-[var(--color-cardinal-500)]
  pl-4 italic text-[var(--color-ink-700)]`. Multi-line quotes preserve line
  breaks via `whitespace-pre-line`.

The paragraph "absorber" loop now also breaks on fence/blockquote/table
candidates so a paragraph cannot accidentally swallow a following block.

## Fix 2 — Empty-state copy

Audited every entry in the table. Only one string was changed; the rest
already match the spec verbatim.

| File | Before | After |
| --- | --- | --- |
| `chat-shell.tsx` (empty CXC AI subtitle) | `Answers grounded in public CardinalXchange questions and answers.` | `Grounded in public CardinalXchange questions. Always check the source.` |

Verified unchanged (already correct, "Keep" per spec):

- `apps/web/frontend/features/questions/components/question-feed.tsx`
  unfiltered: `No questions yet. Be the first — Ask a Question.` +
  `Post a focused question with enough context for a classmate to answer.`
- `question-feed.tsx` filtered tag and filtered query supporting copy.
- `apps/web/app/(forum)/tags/page.tsx` no-tags state.
- `apps/web/frontend/features/questions/components/answer-list.tsx`
  no-answers: `No answers yet. Add the first one below.`
- `apps/web/frontend/features/cxc-ai/components/chat-history-rail.tsx`
  empty rail: `No past chats yet.`

## Fix 3 — Web-source pill behavior

`apps/web/frontend/features/cxc-ai/components/citation-bubble.tsx`

Audit findings:

- The chip is a `<button>` that opens a hover/click popover. Inside the
  popover, an `Open source ↗` anchor was unconditionally setting
  `target="_blank"` for both web AND question/answer kinds. The arrow glyph
  was already present on the popover anchor for all kinds. The chip label
  itself had no external-link affordance for web sources.

Changes:

- Web kind: chip label now shows a small `↗` glyph (`aria-hidden`) after the
  label so the user can tell at a glance it leaves the site.
- Web kind: popover `Open source ↗` anchor opens in a new tab with
  `rel="noreferrer noopener" target="_blank"`. Target URL prefers
  `source.url`.
- Question / Answer kinds: popover `Open source ↗` now navigates to
  `/questions/<questionId>` in the same tab (no `target="_blank"` /
  `rel="noreferrer"`). Previously it was incorrectly opening the internal
  question page in a new tab. This is the "current behavior, keep it"
  intent — same-tab routing for internal sources.
- No change to popover layout, hover/blur timers, or `aria` attributes.

## Verification

- `pnpm typecheck` — all 4 workspaces green.
- `pnpm lint` — all 4 workspaces green (`eslint . --max-warnings=0`).
- Visual: a `/browse` screenshot of a populated question page at 1440x900 was
  not captured because the database is empty per project memory
  (`project_no_seed_data.md` — design every page for the empty state, do not
  seed fixtures). With no question containing markdown demo content there is
  no populated page to screenshot. The unit-level visual contract is enforced
  by the existing markdown component classes; rendering is exercised in code
  review.

## Boundaries respected

- Edits limited to `apps/web/frontend/features/**` and the wording in
  `apps/web/app/(forum)/tags/page.tsx` (no change needed there).
- No edits in `apps/web/backend/**`, `packages/**`, `apps/web/app/layout.tsx`,
  or shell components.
- No new dependencies. No `dangerouslySetInnerHTML`. No retry logic added.
