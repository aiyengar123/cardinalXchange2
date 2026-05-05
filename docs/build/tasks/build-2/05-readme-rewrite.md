# Task — README rewrite

Current `README.md` contradicts the actual codebase. Rewrite it to be honest and useful.

## Goal

Replace the current `README.md` with one that accurately reflects what's shipped, what's intentionally not, and how to run / develop / contribute. Keep the spirit (Stanford-focused Q&A) but drop the marketing copy that doesn't match the code (votes, reputation, SUNet SSO, shadcn, "course-aware tags", image uploads).

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading (in this order)

1. `README.md` (current) — note the section names; see what's worth keeping (intro hook, team, license).
2. `STRUCTURE.md` — folder map, naming conventions, boundary rules. The README should reference this for deep details, not duplicate it.
3. `docs/architecture.md` — canonical product/architecture spec. The README should align with it on what's in/out of scope.
4. `CLAUDE.md` — "Out Of Scope" list and "Common Commands".
5. `docs/build/README.md` — the build-1 plan that shipped.
6. `package.json` (root + `apps/web` + `packages/db`) — actual scripts.

## What the new README should have

In this order:

1. **Title + one-line tagline** (e.g., "A Stanford Q&A platform — public questions, public answers, and an optional AI assistant grounded in the community's own threads.").
2. **Status** — one short paragraph: where the project actually is (MVP shipped, what works today). Honest, not aspirational.
3. **What's in scope** — bulleted list mirroring the architecture doc's "Stage 0" contract: public questions/answers/tags, CXC AI as full-page mode, etc.
4. **What's NOT in scope** — bulleted list pulling from `CLAUDE.md`'s out-of-scope items (auth, votes, reputation, courses, etc.). Honest about the "not yet" framing.
5. **Quick start** — `docker compose up -d postgres`, `pnpm install`, `pnpm db:push` (or whatever the actual prisma deploy command is — verify), `pnpm dev`. Make this run-the-app-in-3-minutes.
6. **Development** — `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`. Note that pre-commit runs lint-staged automatically.
7. **Repo layout** — 6-line summary pointing at `STRUCTURE.md` for the full map.
8. **Tech stack** — actual list: Next.js 16, Turbopack, Prisma, Postgres, Vercel AI SDK, Tailwind v4, Inter font. Pin versions if you can read them from package.json. Drop anything that's not actually installed (no shadcn, no NextAuth, no Redis, no Meilisearch).
9. **Contributing** — short note: branch off main, lint-staged auto-formats on commit, CI must be green to merge.
10. **Team** — keep current team list verbatim from current README.
11. **License** — keep current license line.

## Hard rules

- **Be honest.** If something's not built, don't list it as a feature. The phrase "MVP" is fine; "powered by" implies present-tense, not future.
- **Do not** mention votes, reputation, course pages, SUNet OAuth, shadcn/ui, NextAuth, Redis, Meilisearch, or any out-of-scope item as if it's working. Either omit or list under "Not in scope".
- **Do not** add a Bash code-block longer than 6 lines. README is signposting; deep details live in other docs.
- **Do not** introduce new dependencies.
- **Do not** edit `STRUCTURE.md`, `docs/architecture.md`, or `CLAUDE.md` — those are linked, not duplicated.
- Keep the team names from the current README exactly as listed.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` — should all still pass (you didn't touch code, but verify).
- Open the new README in a markdown preview and read it end-to-end. If you stop at any point and ask "wait, is that true?", fix it.

## Output

Commit your work directly to `main`. Write a short note to `docs/build/proposals/readme-rewrite.md` listing the major changes (what was dropped, what was added) and the verification status.

## Report back

≤200 words. Major sections changed, anything you couldn't reconcile, blockers.
