# CardinalXchange

A Stanford Q&A platform — public questions, public answers, and an optional AI assistant grounded in the community's own threads.

## Status

Early MVP. The forum surface (browse questions, ask, view detail, post answers, browse tags) is wired end to end against Postgres through Prisma. CXC AI is live as a full-page chat at `/cxc-ai` with streaming responses, internal retrieval over public Q&A, and Prisma-backed chat persistence. Authentication is wired via Better Auth — Stanford SAML SSO (placeholder config, awaiting production credentials) and a `stanford.edu` magic-link fallback for development; public profile (`/users/[id]`) and private settings (`/settings`) pages are live. The database ships empty by design; every page is built to render correctly with zero rows.

## In scope

- Public questions, public answers, and tag pages.
- An "unanswered" view filter derived from `answers === 0`.
- CXC AI as a full-page chat mode at `/cxc-ai` and `/cxc-ai/[chatId]`, with source-labeled responses retrieved from public Q&A.
- An "Ask the Community" tool that produces a transient draft for the user to review — nothing is posted until the user submits the regular question form.
- Local Postgres via Docker Compose; Supabase Postgres as the deploy target.

## Not in scope (yet)

These are intentionally absent from the codebase. Don't expect them to work and don't add them as side quests:

- Votes, accepted-answer marking, reputation, notifications, admin/moderation tooling.
- Courses, course pages, pinned courses, course-aware navigation.
- Image upload flows.
- Redis, Meilisearch/Elasticsearch, object storage, analytics.
- Seed data — the empty DB is canonical.

See [`docs/architecture.md`](./docs/architecture.md) for the full product contract.

## Quick start

Requires Node 22+, `pnpm@10.33.2`, and Docker.

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:deploy
pnpm dev
```

The app boots at http://localhost:3000. CXC AI is optional — if `OPENAI_API_KEY` is unset, the chat route falls back to an extractive answer over internal context.

## Development

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm test` runs Vitest across every workspace via Turbo. A husky `pre-commit` hook runs `lint-staged` to format and lint staged files; CI must be green before merge.

## Repo layout

```
apps/web        Next.js App Router app — the only deployable
packages/db     Prisma schema, migrations, query helpers
packages/ui     client-safe React primitives + design tokens
packages/config shared TS configs
docs/           architecture spec + build plan
```

`apps/web` is split into `app/` (routes), `backend/` (server orchestration), `frontend/features/` (client modules), and `shared/` (framework-free helpers). Boundaries, naming conventions, and a per-folder map live in [`STRUCTURE.md`](./STRUCTURE.md).

## Tech stack

- **Framework**: Next.js 16 (App Router, Turbopack), React 19, TypeScript 6.
- **Styling**: Tailwind CSS v4 with `@theme inline` design tokens; Inter and JetBrains Mono via `next/font/google`. Icons from `lucide-react`.
- **Data**: Postgres 17, Prisma 7, Zod for input validation.
- **AI**: Vercel AI SDK 6 (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`); OpenAI provider, server-only keys.
- **Tooling**: pnpm + Turbo monorepo, ESLint 9, Prettier 3, Vitest 3 + jsdom + Testing Library, husky + lint-staged.

## Contributing

Branch off `main`, keep commits scoped, and open a PR. The pre-commit hook formats and lints staged files automatically. CI runs `lint`, `typecheck`, `test`, and `build` — all four must pass to merge. New features go in `apps/web/frontend/features/<feature>/`; backend orchestration goes in `apps/web/backend/<feature>/`. Don't break the boundary rules in `STRUCTURE.md`.

## Team

- Kevin Wang
- Britney Bennett
- Aditya Iyengar
- Adarsh Ambati

## License

MIT. See [LICENSE](./LICENSE).
