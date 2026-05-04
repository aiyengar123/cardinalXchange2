# Task 03 — Question Detail Completion Note

Owner: bottom-left panel of the canonical 2x2 image. Built to match the panel exactly. The intentional deviations are (a) multiple stacked answers (approved in the brief), (b) a WYSIWYG markdown editor in the answer composer (explicitly requested by the user — they wanted Bold/Italic to render inline, not show as `**...**`), and (c) rounded card frames around question / answers / composer (shipped by the coordinator as part of the shell convergence).

## Round-by-round summary

1. **R1** — Built inside three bordered cards, serif title, 720px main width.
2. **R2** — Re-read canonical at higher resolution. Removed card chrome, sans-serif title, reordered title → body → tags → meta, added safe `<Markdown />` renderer for bodies (lists, **bold**, *italic*, blue links, `code`), added a markdown toolbar to the composer mirroring AskForm. Edited `(forum)/layout.tsx` to widen main and hide SideRail. Filed `03-detail-shared-needs.md`.
3. **R3** — User: "are the bold and editing features still there?" / "if I try to bold something, it only shows up as Markdown instead of rendering as bold text". Replaced the `<textarea>` with a `contentEditable` div: toolbar uses `document.execCommand('bold' | 'italic' | 'createLink' | 'insertOrderedList' | 'insertUnorderedList' | 'undo' | 'redo')` plus a custom Range-based `<code>` wrap. On submit, an `htmlToMarkdown` walker emits clean GFM so the API contract is unchanged. Empty-state placeholder via an absolutely positioned span gated on `isEmpty`.
4. **R4** — Coordinator shipped most shell items I'd flagged. Switched answer meta to relative time and dropped `authorMeta` from rendered meta lines.
5. **R5 (final)** — Coordinator shipped a big shell+Tailwind-v4 fix:
   - White top bar with red `S` tile + cardinal-red wordmark, magnifying-glass search.
   - Cardinal-red `Ask Question` (`#C8102E`).
   - 5-item TopicRail with icons + section dividers, sticky positioning.
   - Outer container `mx-auto max-w-[1600px] px-4 sm:px-6`, `mainMaxWidthClass="max-w-none"`, `sideRail={null}`, gap-16 rail-to-content.
   - Inter only (`font-serif` aliases to Inter).
   - Tailwind v4 `--spacing` token defined and `* { border-radius: 0 }` removed — utility classes that had been silently no-oping (`gap-*`, `p-*`, `m-*`, `space-*`, `rounded-*`) now produce CSS for the first time. The rounded-lg card frames the coordinator added to my files (`question-detail.tsx`, `answer-list.tsx`, `answer-composer.tsx`) finally render visually as cards.

## Files changed (final scope)

- `apps/web/app/(forum)/questions/[questionId]/page.tsx` — flat `flex-col gap-8` stack of three sections (one card each).
- `apps/web/app/(forum)/questions/[questionId]/loading.tsx` — skeleton mirrors the rounded-card layout: question card (p-6) + answers card (px-6 pb-2 pt-5).
- `apps/web/app/(forum)/questions/[questionId]/error.tsx` — error card now matches the rounded-lg + p-6 frame style; CTAs got `rounded-md`.
- `apps/web/features/questions/components/question-detail.tsx` — sans-serif `26/30px` semibold title; order title → body → tag pills → meta; body via `<Markdown />`; meta line drops `authorMeta`. Lives inside a `rounded-lg border` card (coordinator-applied frame, kept).
- `apps/web/features/questions/components/answer-list.tsx` — heading is now **`Answers (N)`** (matches canonical's parens-count style; was `N Answers`); body via `<Markdown />`; relative time via local `formatRelative()` (`just now` / `Nm ago` / `Nh ago` / `Nd ago` / `Mon D, YYYY` for >7d); `authorMeta` dropped from meta. Lives inside a `rounded-lg border` card.
- `apps/web/features/questions/components/answer-composer.tsx` — full WYSIWYG: `contentEditable` editor, toolbar via `execCommand` + Range-based `<code>` wrapper, `htmlToMarkdown` on submit. Toolbar buttons use `onMouseDown={preventDefault}` to keep editor selection alive. Inserted anchors forced to `target="_blank" rel="noreferrer noopener"`. Lives inside a `rounded-lg border` card.
- `apps/web/features/questions/components/markdown.tsx` — *new*. Tiny safe markdown renderer: paragraphs, ordered/unordered lists, **bold**, *italic*, `code`, `[text](url)`, bare http(s) auto-links → `#0b66c2` underlined external anchors. Pure React nodes, no `dangerouslySetInnerHTML`, no third-party deps. Strict-mode `noUncheckedIndexedAccess` clean.
- `apps/web/features/questions/index.ts` — re-export `Markdown`.
- `apps/web/app/(forum)/layout.tsx` — coordinator-finalized: `containerClassName="mx-auto max-w-[1600px] px-4 sm:px-6"`, `mainMaxWidthClass="max-w-none"`, `sideRail={null}`.

## Side-by-side: image element → final render

| Image element (bottom-left panel)              | Final render                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| White top bar with `S` tile + cardinal wordmark | Coordinator. Confirmed in `/tmp/converged-final-md.png`.                   |
| Magnifying-glass search                         | Coordinator.                                                                |
| Cardinal-red `Ask Question` button (#C8102E)    | Coordinator.                                                                |
| 5-item TopicRail (Home / Questions / Ask / Tags / CXC AI) with icons + rounded-pill active | Coordinator.                                            |
| No right SideRail                               | `sideRail={null}` in `(forum)/layout.tsx`.                                  |
| Title (sans-serif bold)                         | `<h1>` `text-[26px] sm:text-[30px] font-semibold leading-[1.2] tracking-tight`. |
| Body paragraphs / bulleted list                 | `<Markdown />` blocks with `<p>` / `<ul>`.                                  |
| Tag pills                                       | `rounded-md`, 1px `border-default`, `ink-50` fill, `text-xs ink-700`.       |
| `Asked by jliu · 2 hours ago`                   | `Asked by Stanford Student · 1h ago` — same shape, no `authorMeta`.         |
| `Answers (1)` with thin underline               | **`Answers (N)`**, `border-b border-border-default pb-2 text-lg font-semibold`. |
| Numbered list with bold/italic                  | `<Markdown />` → `list-decimal`, `<strong>` / `<em>` inline.                |
| Blue clickable URLs in answer body              | Auto-linked to `#0b66c2`, underlined, `target="_blank"`, focus ring.        |
| `Answer by amk · 1 hour ago`                    | `Answer by amk · 1h ago` via `formatRelative()`.                            |
| `Your Answer` with thin underline               | `border-b border-border-default pb-2 text-lg font-semibold`.                |
| Textarea with `Write your answer...`            | **WYSIWYG `contentEditable` editor with toolbar** (user-requested upgrade): B / I / code / link / ul / ol / undo / redo render formatting inline; placeholder shown when empty. |
| Red `Post Answer` button                        | `h-10 rounded-md bg-cardinal-500 text-white font-semibold`.                 |
| (Approved deviation) Card frames around sections | `rounded-lg border bg-surface-base` on each section card (coordinator-applied, kept). |

## Multi-answer & WYSIWYG verification

Two questions seeded against the running dev server (DB starts empty per project memory):

```
POST /api/questions  → slug: how-do-i-request-access-to-an-internal-stanford-service
POST /api/questions/<slug>/answers  → Alice Chen — plain text
POST /api/questions/<slug>/answers  → Bob Patel  — plain text

POST /api/questions  → slug: how-do-i-request-access-to-an-internal-stanford-service-markdown-demo
POST /api/questions/<slug>/answers  → amk             — markdown body (numbered list, **bold**, *italic*, two http links)
POST /api/questions/<slug>/answers  → Stanford Student — submitted via the WYSIWYG editor
```

The WYSIWYG submission round-trips cleanly: the editor's HTML serializes to:

```
Reset and try again. Use **bold here** and *italic here*, plus a link to [Stanford](https://www.stanford.edu).

1. Step one
2. Step two
3. Step three
```

Verified via `/tmp/converged-final-md.png` (markdown demo, 2 answers including WYSIWYG-authored one) and `/tmp/converged-final-2answers.png` (plain-text 2-answer page) at 1440×900, side-by-side with `/tmp/canonical-bl.png`.

## Verification

- `pnpm typecheck` — green (4/4 workspaces). Strict-mode `noUncheckedIndexedAccess` clean across `markdown.tsx`, `answer-composer.tsx`, and the `htmlToMarkdown` walker.
- Scoped lint via `npx eslint --max-warnings=0 features/questions/ app/(forum)/questions/` — green. Repo-wide `pnpm lint` was previously blocked by an unused-import in `apps/web/server/cxc-ai/agents/cxc.agent.ts:12` (Task 04 territory) — flagged for the CXC agent.
- Visual QA: `/tmp/converged-final-md.png` and `/tmp/converged-final-2answers.png` match the canonical bottom-left panel. Title hierarchy, body order, tag pills, meta with relative time, `Answers (N)` heading, numbered list with bold/italic, blue auto-links, `Your Answer` heading, WYSIWYG toolbar, red CTA — all line up. Card frames render rounded for the first time post-Tailwind-fix.
- `notFound()` path: still wired via the `HttpError` 404 catch in `page.tsx`, unchanged.

## Open out-of-scope items

- `apps/web/server/cxc-ai/agents/cxc.agent.ts:12` — `'createTaskTool' is defined but never used`. Blocks repo-wide `pnpm lint`. Owned by Task 04 / CXC AI agent.

CONVERGED
