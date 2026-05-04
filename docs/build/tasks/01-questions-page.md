# Task 01 — Questions List Page (`/` and `/questions`)

You own the **top-left panel** of the canonical image.

`/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

**Read the image first.** Look at the top-left panel.

## Read the shared brief

`docs/build/tasks/SHARED-CONTEXT.md` — covers the rules, what you can/can't touch, verification gate, and tone.

## Your scope

- `apps/web/app/(forum)/page.tsx` (currently redirects to `/questions`)
- `apps/web/app/(forum)/questions/page.tsx`
- `apps/web/app/(forum)/questions/loading.tsx`
- `apps/web/app/(forum)/questions/error.tsx`
- Components under `apps/web/frontend/features/questions/components/`:
  - `question-feed.tsx`
  - `question-row.tsx`
  - `question-detail.tsx` ← **DO NOT TOUCH** — that's task 03's territory
  - `answer-list.tsx` ← DO NOT TOUCH
  - `answer-composer.tsx` ← DO NOT TOUCH

## What the image shows (top-left panel)

Look carefully. Confirm each of these in the image and reproduce:

- **Top bar:** cardinal-red header with `CardinalXchange` wordmark left, search input centered, square-ish `Ask Question` button right
- **Left rail:** narrow column under the top bar with: `CXC AI`, `Questions` (active), `Topics`, `Trending` — wait, the rail order is now Home / Questions / Tags / CXC AI. Check the actual image labels and reconcile if they conflict. The image is the source of truth on label text.
- **Page title:** large serif `Questions` heading
- **Question rows:** stacked, divider between, each with title (link, cardinal accent on hover), 1–2 line snippet, tag pills, meta line ("asked by … · N answers · time")
- **Empty state (DB is empty):** must show real empty state, not fake rows

## What is currently wrong (per user feedback)

The user reports the page diverges from the image. Open `http://localhost:3000/questions` in a browser (use `/browse` skill or curl). Compare. List every divergence. Then fix them.

Likely candidates (from prior reviews):
- Filter tabs (`Newest / Active / Unanswered`) — confirm position, sizing, active state
- Empty state copy and CTA placement
- Title vs rail vs main column alignment at the top edge
- Tag pill styling (square vs hairline-rounded)
- Question count line ("N questions") — does the image show one? If yes, add it. If not, don't.

## Hard rules

- **Image is law.** When the image and a doc disagree, the image wins.
- **No fake content.** DB is empty. The page must look correct empty.
- **Do not modify shared shell components.** If TopicRail, TopCommandBar, SideRail, or PageShell are wrong, write a note in `docs/build/tasks/notes/01-questions-shared-needs.md` describing what would need to change, and proceed with local fixes only.
- **Do not introduce new dependencies.**
- **Allowed shapes:** rectangular with `rounded-md` (6px) or square. Avoid pill/circular shapes unless the image shows them.
- **Cardinal red is the only chromatic accent.** Use `var(--color-cardinal-500)`.

## Verification

1. `pnpm typecheck` and `pnpm lint` from repo root — green
2. Visit `http://localhost:3000/questions` in a browser
3. Take a screenshot, compare to the top-left image panel
4. If the answer to "Does what I made look like this?" is no, iterate

## Sub-agents

You may spawn sub-agents for parallelizable subtasks (e.g., one drafts the row, one QAs viewport behaviors). Brief them tightly with self-contained prompts; they do not have your context.

## Completion note

Write to `docs/build/tasks/notes/01-questions-completion.md`. Include:

- File list of changes
- Side-by-side: image element → final state
- Any shared-shell needs flagged separately
- Verification: typecheck/lint exit codes, screenshot path

Cmux markdown viewer is your friend — open this brief or the SHARED-CONTEXT.md whenever you need to re-read it.
