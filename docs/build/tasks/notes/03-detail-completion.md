# Task 03 — Question Detail Completion Note

Owner: bottom-left panel of the canonical 2x2 image. Built to match the panel exactly. The sole intentional deviations are (a) multiple stacked answers (approved in the brief) and (b) a WYSIWYG markdown editor in the answer composer (explicitly requested by the user during this round — they wanted Bold/Italic/etc. to render inline, not show as `**...**`).

## Round-by-round summary

1. **R1** — Built the page inside three bordered cards, serif title, inherited 720px main width. User pushed back: "are the bold and editing features still there? Is it wide enough? Why is it so thin?".
2. **R2** — Re-read the canonical at higher resolution. Removed card borders, switched title to sans-serif, reordered title → body → tags → meta, added a tiny safe `<Markdown />` renderer for bodies (lists, **bold**, *italic*, blue links, `code`), added a markdown toolbar to the composer mirroring AskForm. Edited `(forum)/layout.tsx` to widen main to 920px and hide the SideRail (per canonical). Filed `03-detail-shared-needs.md` with the four shell-level deltas I couldn't reach.
3. **R3** — User: "if I try to bold something, it only shows up as Markdown instead of rendering as bold text". Replaced the `<textarea>` with a `contentEditable` div: toolbar uses `document.execCommand('bold' | 'italic' | 'createLink' | 'insertOrderedList' | 'insertUnorderedList' | 'undo' | 'redo')` and a custom Range-based `<code>` wrap. On submit, a small `htmlToMarkdown` walker emits clean markdown so the API contract stays unchanged. Empty-state placeholder is rendered via an absolutely positioned span gated on `isEmpty`. The Markdown renderer for read-side display is unchanged.
4. **R4 (this round, post-shell-update)** — Coordinator shipped the shell items I'd flagged: white top bar with red 'S' tile + cardinal-red wordmark, magnifying-glass search icon, brighter cardinal `#C8102E` Ask Question button, Inter-only typography (`font-serif` aliases to Inter), 5-item TopicRail with icons, rounded gray-pill active state. With the shell now matching the canonical, the only remaining deltas in my scope were the meta lines:
   - **Relative timestamps on answers.** Canonical shows `Answer by amk · 1 hour ago`. I had `Answer by amk · Staff · UIT · May 4, 2026, 10:32 AM`. Replaced the absolute `Intl.DateTimeFormat` with a small `formatRelative()` (`just now` / `Nm ago` / `Nh ago` / `Nd ago` / fallback `Mon D, YYYY` for >7d). The question's `askedAt` was already server-formatted relative, so no change needed there.
   - **Drop `authorMeta` from meta lines.** Canonical shows `Asked by jliu · 2 hours ago` and `Answer by amk · 1 hour ago` with no `authorMeta`. The data is still in the DTOs (a future profile/role surface can use it), but the meta line on `question-detail.tsx` and `answer-list.tsx` no longer concatenates it.

## Files changed (final scope)

- `apps/web/app/(forum)/questions/[questionId]/page.tsx` — flat `flex-col gap-8` stack of three sections; removed the back-link, the local `max-w-4xl`, and the heavy card chrome.
- `apps/web/app/(forum)/questions/[questionId]/loading.tsx` — flow-layout skeleton that mirrors the new layout: title block + tags + meta + thin-underline section headers.
- `apps/web/features/questions/components/question-detail.tsx` — sans-serif `26/30px` semibold title; order title → body → tag pills → meta; body rendered through `<Markdown />`; `authorMeta` no longer concatenated into the asked-by line.
- `apps/web/features/questions/components/answer-list.tsx` — flat `border-b` underlined heading (no card box), 1px `ink-100` divider between answers, body rendered through `<Markdown />`, **relative-time meta** via local `formatRelative()`, `authorMeta` no longer concatenated.
- `apps/web/features/questions/components/answer-composer.tsx` — full WYSIWYG rewrite: `contentEditable` editor, toolbar via `execCommand` + a Range-based `<code>` wrapper, `htmlToMarkdown` on submit so the body persisted is GitHub-flavored markdown round-tripping back through `<Markdown />`. Toolbar buttons use `onMouseDown={preventDefault}` to keep the editor selection alive across clicks. Inserted anchors are forced to `target="_blank" rel="noreferrer noopener"`.
- `apps/web/features/questions/components/markdown.tsx` — *new*. Tiny safe markdown renderer: paragraphs, ordered/unordered lists, **bold**, *italic*, `code`, `[text](url)`, bare http(s) auto-links → `#0b66c2` underlined external anchors. Pure React nodes, no `dangerouslySetInnerHTML`, no third-party deps. Strict-mode `noUncheckedIndexedAccess` clean.
- `apps/web/features/questions/index.ts` — re-export `Markdown`.
- `apps/web/app/(forum)/layout.tsx` — passed `mainMaxWidthClass="max-w-[920px]"` and `sideRail={null}` to `PageShell`. (Documented in `03-detail-shared-needs.md`; the coordinator confirmed shipping the shell-side parts.)

## Side-by-side: image element → final render

| Image element (bottom-left panel)              | Final render                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| White top bar with `S` tile + cardinal wordmark | Shipped by coordinator. Confirmed in `/tmp/converged-md-demo.png`.          |
| Magnifying-glass search input                   | Shipped by coordinator.                                                     |
| Cardinal-red `Ask Question` button (#C8102E)    | Shipped by coordinator.                                                     |
| 5-item TopicRail with icons + rounded-pill active | Shipped by coordinator.                                                   |
| No right SideRail                               | `sideRail={null}` from `(forum)/layout.tsx` (mine).                         |
| Title (sans-serif bold)                         | `<h1>` `text-[26px] sm:text-[30px] font-semibold leading-[1.2] tracking-tight`. |
| Body paragraphs / bulleted list                 | `<Markdown />` blocks with `<p>` / `<ul>`.                                  |
| Tag pills (`stanford-services`, `access`, `it-support`) | `rounded-md`, 1px `border-default`, `ink-50` fill, `text-xs ink-700`. |
| `Asked by jliu · 2 hours ago`                   | `Asked by Stanford Student · 32m ago` — same shape, no `authorMeta`.        |
| `Answers (1)` with thin underline               | `1 Answer` / `2 Answers` heading, `border-b border-border-default pb-2`.    |
| Numbered list with bold/italic in answer body   | `<Markdown />` → `list-decimal`, `<strong>` / `<em>` inline.                |
| Blue clickable URLs in answer body              | Auto-linked to `#0b66c2`, underlined, `target="_blank"`, focus ring.        |
| `Answer by amk · 1 hour ago`                    | `Answer by amk · 32m ago` via `formatRelative()`.                           |
| `Your Answer` with thin underline               | Heading `border-b border-border-default pb-2 text-lg font-semibold`.        |
| Textarea with `Write your answer...`            | **WYSIWYG `contentEditable` editor with toolbar** (user-requested upgrade): B / I / code / link / ul / ol / undo / redo render formatting inline; placeholder shown when empty. |
| Red `Post Answer` button                        | `h-10 rounded-md bg-cardinal-500 text-white font-semibold`.                 |

## Multi-answer & WYSIWYG verification

Two questions seeded against the running dev server (DB starts empty per project memory):

```
POST /api/questions  → slug: how-do-i-request-access-to-an-internal-stanford-service
POST /api/questions/<slug>/answers  → Alice Chen — plain text
POST /api/questions/<slug>/answers  → Bob Patel  — plain text

POST /api/questions  → slug: how-do-i-request-access-to-an-internal-stanford-service-markdown-demo
POST /api/questions/<slug>/answers  → amk             — markdown body (numbered list, **bold**, *italic*, two http links)
POST /api/questions/<slug>/answers  → Stanford Student — submitted via the WYSIWYG editor (Bold / Italic / Link / numbered list)
```

The second question's second answer round-trips the WYSIWYG editor → `htmlToMarkdown` → API → DB → `<Markdown />` cleanly:

```
Reset and try again. Use **bold here** and *italic here*, plus a link to [Stanford](https://www.stanford.edu).

1. Step one
2. Step two
3. Step three
```

`/questions/how-do-i-request-access-to-an-internal-stanford-service-markdown-demo` (`/tmp/converged-md-demo.png`) and `/questions/how-do-i-request-access-to-an-internal-stanford-service` (`/tmp/converged-2answers.png`) both rendered cleanly at 1440x900 and compared side-by-side with `/tmp/canonical-bl.png`.

## Verification

- `pnpm typecheck` — green (4/4 workspaces). Strict-mode `noUncheckedIndexedAccess` clean across the new `markdown.tsx`, the rewritten `answer-composer.tsx`, and the `htmlToMarkdown` walker.
- `pnpm lint` for my scope (`features/questions/`, `app/(forum)/questions/`) — green via `npx eslint`. Repo-wide `pnpm lint` is currently blocked by an unused-import error in `apps/web/server/cxc-ai/agents/cxc.agent.ts` (Task 04 territory, not in my lane). Flagged for the CXC agent.
- Visual QA: `/tmp/converged-md-demo.png` and `/tmp/converged-2answers.png` matched against `/tmp/canonical-bl.png`. Title, body order, tags, meta, thin underlines under section headers, numbered list with bold/italic, blue auto-links, relative timestamps, red CTA — all line up.
- `notFound()` path: still wired via the `HttpError` 404 catch in `page.tsx`, unchanged.

## Open out-of-scope items

- `apps/web/server/cxc-ai/agents/cxc.agent.ts:12` — `'createTaskTool' is defined but never used`. Blocks repo-wide `pnpm lint`. Owned by Task 04 / CXC AI agent.

CONVERGED
