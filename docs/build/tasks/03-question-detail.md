# Task 03 — Question Detail Page (`/questions/[questionId]`)

You own the **bottom-left panel** of the canonical image.

`/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

**Read the image first.** Look at the bottom-left panel.

## Read the shared brief

`docs/build/tasks/SHARED-CONTEXT.md` — rules, scope, verification, tone.

## Your scope

- `apps/web/app/(forum)/questions/[questionId]/page.tsx`
- `apps/web/app/(forum)/questions/[questionId]/loading.tsx`
- `apps/web/app/(forum)/questions/[questionId]/error.tsx`
- Components under `apps/web/features/questions/components/`:
  - `question-detail.tsx`
  - `answer-list.tsx`
  - `answer-composer.tsx`
- DO NOT TOUCH: `question-feed.tsx`, `question-row.tsx` (task 01 territory)

## What the image shows (bottom-left panel)

The image shows ONE answer below the question. Your build supports MULTIPLE answers. This is the only intentional deviation per the original brief.

Reproduce the layout, expanded for multiple answers:

- Same shared shell as the other panels
- **Question header**: title (serif, large), tag pills, meta ("asked by … · time")
- **Question body**: full text, readable serif/sans hybrid (confirm from image)
- **Answers section**: heading line (e.g., "1 Answer" / "N Answers"), then each answer in a stacked card with body text + author + time, separated by 1px divider
- **Answer composer** at the bottom: textarea + cardinal-red Post Answer button

## What is currently wrong (per user feedback)

Diverged from the image. Open a real question detail page (you'll need to create one via /ask first, since DB is empty, or hit `http://localhost:3000/questions/some-fake-id` to see the not-found behavior).

Likely drift:
- Heading hierarchy (question title vs answer count vs answer body)
- Spacing between question and answers
- Composer placement (in-line at bottom vs sticky)
- Author/time meta styling

## Backend contract (don't change, just consume)

- Server action: `getQuestionDetail(id)` from `@/server/questions` returning `QuestionDetailDto` with `answersList: AnswerDto[]`
- Submit answer: `POST /api/questions/[id]/answers` with `CreateAnswerInput`
- On success: `router.refresh()` or update local state with the new answer

## Hard rules

- **Image is law for layout. Multiple answers is the one approved deviation.**
- **No fake content.** Don't hardcode demo answers.
- **`notFound()`** when the question doesn't exist (already wired in Wave 5; verify it still works).
- **Do not edit shared shell or `packages/ui/**`** — flag a note in `docs/build/tasks/notes/03-detail-shared-needs.md`.
- **Allowed shapes:** rectangular with `rounded-md` or square. Cardinal red is the only accent.

## Verification

1. `pnpm typecheck` and `pnpm lint` — green
2. To exercise multiple answers, create a question via the running `/ask` flow, then POST two answers via curl:

```bash
# Find the latest question id (DB is empty so this works once you've posted via /ask)
curl -s http://localhost:3000/api/questions | jq '.[0].id'

# Post answers
curl -X POST http://localhost:3000/api/questions/<id>/answers \
  -H "Content-Type: application/json" \
  -d '{"body":"Answer one.","authorDisplay":"Alice"}'

curl -X POST http://localhost:3000/api/questions/<id>/answers \
  -H "Content-Type: application/json" \
  -d '{"body":"Answer two.","authorDisplay":"Bob"}'
```

3. Open `http://localhost:3000/questions/<id>`. Confirm both answers render in `createdAt asc`.
4. Screenshot, compare to image panel.

## Sub-agents

Allowed.

## Completion note

`docs/build/tasks/notes/03-detail-completion.md` — same format.
