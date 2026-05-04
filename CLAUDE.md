# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo Shape

pnpm + Turbo monorepo for a Stanford Q&A product. One Next.js app at `apps/web` consumes shared packages. Package manager is pinned to `pnpm@10.33.2` via the `packageManager` field; if `pnpm` is not on PATH, use `npm exec pnpm@10.33.2 -- <cmd>`.

```
apps/web        Next.js App Router product app (the only deployable)
packages/db     Prisma schema, migrations, query helpers (Postgres ownership)
packages/ui     client-safe React primitives + Tailwind helpers
packages/config TS configs consumed via @cardinalxchange/config/tsconfig/*
```

## Common Commands

Run from the repo root — Turbo fans out to workspaces.

```
pnpm install
pnpm dev                      # turbo dev → next dev --turbopack on apps/web
pnpm build                    # turbo build (Next build for the web app)
pnpm lint                     # eslint . --max-warnings=0 in each workspace
pnpm typecheck                # tsc --noEmit per workspace
pnpm test                     # currently aliased to typecheck per workspace
pnpm format                   # prettier --write . (uses prettier-plugin-tailwindcss)
```

Single-workspace targeting:

```
pnpm --filter @cardinalxchange/web dev
pnpm --filter @cardinalxchange/web typecheck
pnpm --filter @cardinalxchange/db prisma:validate
```

There is no Vitest/Jest harness yet — `pnpm test` only runs `tsc --noEmit`. When real tests land, they should run through Turbo so `pnpm test` continues to work as the single entry point.

## Database

- Prisma schema lives at `packages/db/prisma/schema.prisma` (Postgres). Models: `Question`, `Answer`, `Tag`, `QuestionTag`, `AiChatSession`, `AiChatMessage`, and `AiChatSource`.
- `packages/db/prisma.config.ts` resolves the migration datasource from `DIRECT_URL` → `DATABASE_URL` → a localhost fallback. Use `DIRECT_URL` for migrations when `DATABASE_URL` is a pooled Supabase connection.
- `packages/db/src/index.ts` exports the Prisma client plus query helpers used by the web app.
- `docker-compose.yml` runs Postgres 17 on host port `54322` and a built web container on `3000`.

Expected flow once the Prisma client and helpers are wired:

```
docker compose up -d postgres
pnpm install
pnpm db:deploy
pnpm db:seed
pnpm dev
```

## Architecture (read this before adding files)

Boundaries are enforced by convention, not by tooling — respect them.

- `apps/web/app` — Next.js App Router routes, layouts, and route handlers (`app/api/*`). Compose feature modules; do not put business logic here. `app/api/**/route.ts` is the HTTP edge of `backend/`; route handlers should be 10-line files that parse → call a service → return a DTO.
- `apps/web/frontend/features` — feature-owned frontend modules (components, hooks, view models) once a feature outgrows a single route. New product UI belongs here. Imported via `@/features/*`.
- `apps/web/backend` — app-local backend orchestration (no React). The pipeline is:
  - `http/contracts.ts` — DTO/input types shared across backend modules.
  - `http/inputs.ts` + `http/http.ts` — payload parsing, validation, and `HttpError`/`jsonError` helpers used by route handlers.
  - `<feature>/<feature>.service.ts` — use-case entry points (`createQuestion`, `addAnswer`).
  - `<feature>/<feature>.queries.ts` / `.mutations.ts` — read/write functions backed by `packages/db`.
  - `cxc-ai/*` — full-page CXC AI orchestration, retrieval, AI SDK helpers, and Prisma-backed chat store. Eval suites land under `backend/cxc-ai/evals/`.
  - `viewer/` — viewer stub (`getViewer` reads `DEV_VIEWER_*` env vars). Future auth wiring lands here.
- `apps/web/shared` — peer of `frontend/` and `backend/`. Holds framework-free helpers (`shared/utils/`) and static literal data (`shared/data/`). Importable from both sides via `@/utils/*` and `@/data/*`.
- `packages/ui` — must stay client-safe. Never import backend, DB, AI, or auth code from this package.

Path alias: `@/*` resolves to `apps/web/*` (see `apps/web/tsconfig.json`). Use it instead of long relative imports inside the web app.

## Domain Model Notes

- `QuestionStatus` uses DB/server status for persistence. `unanswered` is a view filter derived from `answers === 0`, not a separate data primitive.
- Tags are generic topic labels. Courses are explicitly out of scope for the MVP.

## CXC AI

- Separate chat tab, not a gate on the question form. Optional in the MVP.
- Server-side only: `OPENAI_API_KEY` is read by the CXC AI route; if absent, the route falls back to an extractive answer using internal context.
- Internal retrieval is restricted to public `Question`/`Answer` records via `searchInternalContext`. Do not add private chat history, drafts, or auth data to the retrieval set.
- Web context is opt-in through `WEB_CONTEXT_ENDPOINT` (+ optional `WEB_CONTEXT_API_KEY`).
- Human-in-the-loop: AI may draft, but it must not auto-post to the public forum. Anything public goes through the normal question form after explicit user action.
- Persistence direction: AI SDK handles streaming/UI; Prisma owns durable session/message/source storage through generic chat models.

## Environment

`.env.example` covers the current variables:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/cardinalxchange
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/cardinalxchange
OPENAI_API_KEY=
```

Optional, read at runtime: `OPENAI_MODEL` (defaults to `gpt-5-mini`), `WEB_CONTEXT_ENDPOINT`, `WEB_CONTEXT_API_KEY`, `DEV_VIEWER_ID`, `DEV_VIEWER_NAME`, `DEV_VIEWER_META`. Do not introduce auth-related env vars yet — auth, roles, admins, reputation, and notifications are explicitly the **last** items on the roadmap.

## Out Of Scope (do not add)

Per `README.md` and `docs/architecture.md`:

- Login screens, NextAuth, SUNet OAuth wiring (auth is the last milestone).
- Courses, pinned courses, course pages, course-specific navigation.
- Reputation, notifications, admin/moderation tooling.
- Redis, Meilisearch/Elasticsearch, object storage, analytics.
- Image upload flows.

`README.md` and `docs/architecture.md` are the canonical product/architecture spec. Update them whenever implementation status changes.
