# Shared Context — Read This First

You are one of four parallel Claude Code sessions, each owning ONE page of CardinalXchange. The user is frustrated that prior work drifted from the canonical image. Your job is to make YOUR page match the image **exactly**, not adjacent or in spirit — exactly.

## The image is law

`/Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

Use the **Read** tool on this path before you do anything else. The image is a 2×2 grid of four full-page screenshots:

- **Top-left** → Questions list (`/questions`)
- **Top-right** → Ask a Question (`/ask`)
- **Bottom-left** → Question detail with one answer (`/questions/[id]`) — the only intentional deviation: build supports a list of multiple answers
- **Bottom-right** → CXC AI chat (`/cxc-ai`)

Find your panel. Compare it pixel-for-pixel to your current page in the running app at `http://localhost:3000`.

## User direction (verbatim, summarized)

- "Square or circular stuff is okay, so you should add those back in. Make it rectangular." — interpret as: shapes should be rectangular (not round-blob), but rounded corners (`rounded-md` or `rounded-lg`) are allowed where the image clearly shows them. Don't be precious about pure square-only.
- "Does what you made look like this?" — ask yourself this question constantly. If the answer is no, fix it.
- "No fake content" — DB is empty. Show real empty states. Do NOT seed fixtures, do NOT hardcode demo questions/answers/messages.

## Repo state

- Working dir: `/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`
- Dev server: already running at `http://localhost:3000` via `pnpm dev` (do not restart unless it dies)
- Postgres: `localhost:54322`, db `cardinalxchange`, user/pass `postgres/postgres`
- Prisma Studio (running): `http://localhost:51212`
- Build commit history is on `main`; `git log --oneline -10` will orient you

## Required reading (in this order)

1. The image (use Read tool, path above)
2. `docs/build/03-frontend.md` — frontend brief, panel-by-panel
3. `docs/build/04-design.md` — design system + tokens (Stanford cardinal `#8C1515`, square-default but rounded-md allowed on inputs/buttons/cards/rail-items/filters/search)
4. `docs/build/01-organization.md` — boundary rules (frontend imports DTOs only from `@/server/http/contracts`; never `@cardinalxchange/db`)
5. `docs/build/proposals/wave5-fixes.md` — most recent fix pass; understand what's already there
6. `CLAUDE.md` — out-of-scope (no auth, votes, courses, reputation, notifications, admin, image upload, seed data)

## What you can change

You own a specific page. Stay in your lane:

- Page route file under `apps/web/app/(forum)/...` or `apps/web/app/cxc-ai/...`
- Feature components under `apps/web/features/<feature>/components/...` that this page uses
- Local `loading.tsx`, `error.tsx`, `not-found.tsx` for your route

Do NOT edit:
- `packages/ui/**` (design system primitives — these are shared; ask the user if a primitive is wrong)
- `apps/web/server/**` or `apps/web/app/api/**` (backend — flag any contract issue, don't fix it)
- `packages/db/**`
- The shared `PageShell`, `TopCommandBar`, `TopicRail`, `SideRail`, `ChatHistoryRail` (shared shell — ask the user)
- Other pages or other features' components

If a shared piece needs changing for your page to match the image, write a short note in `docs/build/tasks/notes/<your-page>-shared-needs.md` and continue with what you can do locally. The user will reconcile.

## Permitted tools

- `Read`, `Edit`, `Write`, `Bash` (dev server already up — visual QA via curl or `/browse`)
- `Agent` — you may spawn sub-agents for parallelizable subtasks (e.g., one to draft a component, one to QA). Brief them well.
- `cmux markdown open <path>` if you want to surface a doc to the user

## Verification gate

When you think you're done:

1. `pnpm typecheck` from repo root → must pass
2. `pnpm lint` from repo root → must pass
3. Visual QA: hit your route in a browser (or via the gstack `/browse` skill). Take a screenshot. Compare side-by-side with the image panel. If they don't match, you are not done.

## Output

Write a completion note to `docs/build/tasks/notes/<your-page>-completion.md`:

- What you changed (file list + one-line each)
- Side-by-side notes: image element → what you have now
- Anything that would need a shared-shell change to match perfectly
- Verification status (typecheck, lint, screenshot path)

## Tone

The user is frustrated. Don't argue. Look at the image. Match it. Be specific in your reports — name exact pixels, paddings, colors. If something is ambiguous in the image, ask via the cmux conversation rather than guess.
