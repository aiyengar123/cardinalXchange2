# README rewrite — proposal

Replaced the speculative-stack README with one that reflects what's actually shipped.

## Dropped

- "Stack Overflow for Stanford" framing and the long Problem/Solution/What-Makes-It-Different marketing copy.
- Feature claims that don't exist in the code: upvotes/downvotes, accepted-answer marking, reputation, course-aware tags, course pages, SUNet SSO, notifications, image uploads.
- Speculative tech stack (shadcn/ui, TanStack Query, MDX/KaTeX, Redis/Meilisearch, Cloudflare R2/S3, Upstash, Sentry/PostHog, NextAuth, Playwright, FastAPI, Supabase auth).
- "TBD" Getting Started and Contributing sections.
- "Subject to change" hedge on the stack.

## Added / corrected

- Honest **Status** paragraph: MVP forum + CXC AI wired to Postgres via Prisma, no auth, empty DB by design.
- **In scope** list mirroring `docs/architecture.md` Stage 0 (public Q&A, tags, unanswered filter, full-page CXC AI, Ask-the-Community draft tool).
- **Not in scope** list pulling from `CLAUDE.md` (auth, votes, reputation, courses, image upload, Redis/Meilisearch, seed data).
- **Quick start** runbook: `docker compose up -d postgres` → `pnpm install` → `pnpm db:deploy` → `pnpm dev`. Verified `db:deploy` exists in root `package.json` and applies the three real migrations under `packages/db/prisma/migrations/`.
- **Development** lists the four real Turbo scripts: `typecheck`, `lint`, `test`, `build`. Notes the husky `pre-commit` hook running `lint-staged` (config in root `package.json`).
- **Repo layout** as a 5-line summary that points at `STRUCTURE.md` for the full map.
- **Tech stack** with versions verified against `package.json` files: Next.js 16.2.4, React 19.2.5, TS 6, Tailwind v4, Prisma 7, Postgres 17, AI SDK 6 + `@ai-sdk/openai` + `@ai-sdk/react`, Zod 4, lucide-react, ESLint 9, Prettier 3, Vitest 3, jsdom 26, Testing Library 16, husky + lint-staged, pnpm 10.33.2 + Turbo 2.9.8. Inter + JetBrains Mono via `next/font/google` (per `STRUCTURE.md`).
- **Contributing** section: branch off main, lint-staged auto-formats, CI must be green, where features live.
- Kept **Team** list and **License** verbatim.

## Verification

- `pnpm typecheck` — passes (4/4 workspaces).
- `pnpm lint` — passes (0 warnings).
- `pnpm test` — 22/22 tests pass across `db` and `web`.
- `pnpm build` — succeeds; route table prints all expected routes.

## Notes

- README references `STRUCTURE.md`, `docs/architecture.md`, and `LICENSE`; none of those were edited.
- No new dependencies introduced.
- No bash code block exceeds the 6-line limit.
