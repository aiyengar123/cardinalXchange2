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

- Prisma schema lives at `packages/db/prisma/schema.prisma` (Postgres). Models: `Question`, `Answer`, `Tag`, `QuestionTag`, `AiChatSession`, `AiChatMessage`, `AiChatSource`, and the Better Auth tables `User` (mapped to `user`), `Session` (`session`), `Account` (`account`), `Verification` (`verification`).
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
  - `auth/` — Better Auth wiring (`auth.ts` config, `session.ts` `getViewerFromSession`/`requireViewer`). The Next.js handlers live at `app/api/auth/[...all]/route.ts`. **Never call `auth.api.getSession()` from services or route handlers — go through `getViewer()`.**
  - `viewer/` — `getViewer()` reads the live Better Auth session via `auth/session.ts` and falls back to anonymous (or, when `AUTH_DEV_BYPASS=1`, the `DEV_VIEWER_*` stub). This is the only seam the rest of the backend uses to read identity.
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

## Auth

- **Library:** Better Auth (`better-auth`) with `prismaAdapter`. The active config lives in `apps/web/backend/auth/auth.ts`.
- **Mounted handlers:** `apps/web/app/api/auth/[...all]/route.ts` re-exports `toNextJsHandler(auth)`.
- **Identity seam:** `getViewer()` in `apps/web/backend/viewer/viewer.ts` is the only function services or route handlers may call to read identity. Behind it, `getViewerFromSession()` in `apps/web/backend/auth/session.ts` reads the live session. Anonymous viewers have `isAuthenticated: false` and writes 401.
- **Sign-in providers:** the `magicLink` plugin is wired now and only accepts `*@stanford.edu` addresses (server-side guard in `sendMagicLink`). Stanford SSO (SAML/OIDC) is the next provider to wire — the `STANFORD_SAML_*` / `STANFORD_OIDC_*` env vars are placeholders only; do **not** commit real Stanford IT secrets.
- **Email transport:** wired in `apps/web/backend/auth/email-transport.ts` via `nodemailer`. Reads `EMAIL_SERVER_HOST` / `_PORT` / `_USER` / `_PASSWORD` and `EMAIL_FROM`. When all are set, magic-link emails go through SMTP (works in dev or prod — point at Mailtrap to test the real flow locally). When unset: dev logs the link to the server console; prod throws a clear error so the operator sees the deploy is incomplete.
- **Proxy (Next 16):** `apps/web/proxy.ts` redirects unauthenticated users from `/settings` to `/login?next=…` based on the session cookie. (Next 16 deprecated `middleware.ts` in favor of `proxy.ts` — same role, new file name + exported function name.) Full validation still happens server-side in pages and route handlers.

## Environment

`.env.example` covers the current variables:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/cardinalxchange
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/cardinalxchange
OPENAI_API_KEY=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

Optional, read at runtime: `OPENAI_MODEL` (defaults to `gpt-5-mini`), `WEB_CONTEXT_ENDPOINT`, `WEB_CONTEXT_API_KEY`, `EMAIL_SERVER_HOST` / `EMAIL_SERVER_PORT` / `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` / `EMAIL_FROM`, `STANFORD_SAML_*` / `STANFORD_OIDC_*` (placeholders for prod IT to fill), `AUTH_DEV_BYPASS` (`=1` to allow `DEV_VIEWER_*` to stand in for a real session), `DEV_VIEWER_ID` / `DEV_VIEWER_NAME` / `DEV_VIEWER_META`.

## Out Of Scope (do not add)

Per `README.md` and `docs/architecture.md`:

- Courses, pinned courses, course pages, course-specific navigation.
- Reputation, notifications, admin/moderation tooling.
- Redis, Meilisearch/Elasticsearch, object storage, analytics.
- Image upload flows.

`README.md` and `docs/architecture.md` are the canonical product/architecture spec. Update them whenever implementation status changes.

## Testing

- **Vitest** is the project's test framework (Vitest 3, jsdom 26 for component tests).
- `pnpm test` runs Vitest across every workspace via Turbo (`turbo test`). It is no longer an alias for `tsc --noEmit`.
- `pnpm test:watch` reruns tests interactively while developing.
- Per-workspace configs live in `apps/web/vitest.config.ts`, `packages/db/vitest.config.ts`, and `packages/ui/vitest.config.ts`. The root `vitest.workspace.ts` aggregates them so `pnpm exec vitest` from the root also runs everything.
- Tests live in `__tests__/` folders next to the code they cover (e.g. `packages/db/src/__tests__/questions.queries.test.ts`, `apps/web/backend/http/__tests__/inputs.test.ts`, `apps/web/frontend/features/questions/components/__tests__/markdown.test.tsx`).
- `apps/web` uses `@testing-library/react` + `@testing-library/jest-dom` (loaded via `apps/web/vitest.setup.ts`) for component tests.
- Unit-only for now: do not require Postgres, OpenAI, or the network. Mock the Prisma client when you need to test code that imports it.

## Development

- Git commits run `lint-staged` via a husky `pre-commit` hook: `prettier --write` then `eslint --fix` on staged `*.{ts,tsx,js,mjs,cjs}` files, plus `prettier --write` on staged `*.{md,json,css,yml,yaml}` files. Unfixable ESLint errors abort the commit.
- The hook is provisioned by the root `prepare` script (`husky`), so a fresh `pnpm install` wires it up automatically.
- The hook runs on staged files only — it does not run typecheck or vitest. Run `pnpm typecheck` / `pnpm test` yourself before pushing.
- Do not bypass the hook with `--no-verify`; fix the lint error instead.
