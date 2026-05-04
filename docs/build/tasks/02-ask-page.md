# Task 02 — Ask a Question Page (`/ask`)

You own the **top-right panel** of the canonical image.

`/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

**Read the image first.** Look at the top-right panel.

## Read the shared brief

`docs/build/tasks/SHARED-CONTEXT.md` — covers rules, scope boundaries, verification, tone.

## Your scope

- `apps/web/app/(forum)/ask/page.tsx`
- `apps/web/app/(forum)/ask/loading.tsx`
- `apps/web/app/(forum)/ask/error.tsx`
- `apps/web/features/ask/components/` — most importantly `ask-form.tsx`

## What the image shows (top-right panel)

Inspect carefully and reproduce:

- Same shared shell as panel 1 (top bar + left rail)
- **Page title** — large serif heading (likely "Ask a Question" or "Submit a Question" — confirm from the image)
- **Title** input field — single-line, full readable column width
- **Body** textarea — multi-line, taller than Title
- **Tags** input — chip/tag input where typing + comma/Enter commits a tag pill
- **Submit** button — cardinal-red, square or `rounded-md`, label per the image
- Square corners on inputs (1px border) with cardinal-red focus ring

## What is currently wrong (per user feedback)

The page exists but the user feels it has drifted from the image. Open `http://localhost:3000/ask` and diff against the image panel. Common drift:

- Field labels/placeholders not matching the image copy
- Field widths or heights off
- Submit button color/size/shape
- Per-field error states from prior fix pass may be visually heavy — soften if the image doesn't show them
- Spacing between fields

## Backend contract (don't change, just consume)

- DTOs: `CreateQuestionInput` from `@/server/http/contracts`
- Submit: `POST /api/questions` with JSON body matching `CreateQuestionInput`
- On success: navigate to `/questions/[id]` using the returned id

## Hard rules

- **Image is law.** Match it. Do not invent fields.
- **No drafts persisted.** Form state dies on navigate (per architecture doc).
- **No new dependencies.**
- **Do not edit `packages/ui/**`** — flag a note in `docs/build/tasks/notes/02-ask-shared-needs.md` if a primitive is wrong.
- **Allowed shapes:** rectangular with `rounded-md` or square. Cardinal red is the only accent.
- **No auth, no SUNet integration.**

## Verification

1. `pnpm typecheck` and `pnpm lint` — green
2. Visit `http://localhost:3000/ask`
3. Try submitting empty (real validation behavior?), submitting valid input (lands as a real Question row in Postgres — verify via Prisma Studio at `http://localhost:51212`)
4. Screenshot and compare to image panel

## Sub-agents

You may spawn sub-agents. Provide self-contained briefs.

## Completion note

`docs/build/tasks/notes/02-ask-completion.md` — same format as task 01.
