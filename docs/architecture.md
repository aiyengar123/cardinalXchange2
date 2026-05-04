# CardinalXchange Architecture

CardinalXchange is a pnpm/Turbo monorepo for a Stanford-focused Q&A product. The scoped MVP is a simple Stack Overflow-style forum backed by Supabase Postgres and Prisma. CXC AI is an optional full-page chat mode; users should be able to browse, ask, and answer without using AI.

## Product Contract

Stage 0 locks the product to a small Q&A surface:

- Public questions, public answers, tags, and unanswered filtering are in scope.
- Courses are out of scope. Do not add `Course`, pinned courses, course pages, course dashboards, or course-specific navigation.
- Votes, reputation, roles/admins, notifications, auth/SUNet UI, Better Auth, profile/settings, saved drafts, and autosave are out of scope.
- Draft text may exist only as transient client form state. Drafts die if the user does not post them.
- Nothing becomes public until the user explicitly posts through the public forum flow.
- CXC AI is full-page only at `/cxc-ai` and `/cxc-ai/[chatId]`; it must not be implemented as a side panel or inline question-form helper.
- The UI label is `CXC AI`, while database models use generic names: `AiChatSession`, `AiChatMessage`, and `AiChatSource`.

## Current Status

Implemented in the current MVP push:

- `apps/web` renders a clean Stack Overflow-style question list, ask form, question detail, answer form, and full-page CXC AI chat.
- Question list/detail pages read from Postgres through Prisma-backed server services.
- Question and answer submissions write to Postgres. Draft form state is not saved.
- CXC AI uses AI SDK chat primitives at the app boundary and persists generic chat sessions/messages through Prisma.
- Docker Compose starts local Postgres and the web app.

Not implemented yet:

- Authentication or a login screen.
- User profiles/settings.
- Postgres full-text ranking beyond the initial controlled internal retrieval query helpers.

## Intended MVP Architecture

The MVP should keep the system small and database-first.

```txt
Browser
  -> Next.js App Router pages and components
  -> Next.js route handlers / server actions
  -> app-local backend services in apps/web/backend
  -> packages/db
  -> Prisma client
  -> Supabase Postgres / local Postgres

Optional CXC AI
  -> full-page routes at /cxc-ai and /cxc-ai/[chatId]
  -> server-side route handler in apps/web/app
  -> backend orchestration in apps/web/backend
  -> public Question and Answer retrieval
  -> optional bounded web context
  -> source-labeled private chat response
  -> "Ask the Community" transient draft tool
```

Use Postgres as the system of record and as the first search backend. Avoid Redis, Meilisearch, object storage, analytics, and auth packages until the MVP needs them.

Deployment should use Supabase as the managed Postgres provider. Local development can still use Docker Postgres so contributors do not need cloud credentials to run the app.

## Workspaces And Boundaries

- `apps/web/app`: Next.js App Router route tree. Keep layouts, pages, loading/error states, and route handlers here. `app/api/**/route.ts` is the HTTP edge of `backend/`.
- `apps/web/frontend/features`: Product-facing frontend modules grouped by feature. Components, hooks, view models, and frontend-only state belong here when they outgrow a single route.
- `apps/web/backend`: App-local backend orchestration. Route handlers and server actions should call into this layer for question, answer, tag, search, and optional CXC AI use cases. The viewer stub lives at `backend/viewer/`; future auth wiring lands there. CXC AI eval suites live at `backend/cxc-ai/evals/`.
- `apps/web/shared`: Framework-free helpers (`shared/utils/`) and static literal data (`shared/data/`). Importable from both `frontend/` and `backend/`.
- `packages/db`: Prisma schema, migrations, generated client, seed workflow, and Postgres query helpers. This is the only shared package that should know about Prisma.
- `packages/ui`: Shared React primitives and styling helpers. This package must stay client-safe and must not import database, AI, or auth code.
- `packages/config`: Shared TypeScript configuration used by apps and packages.

Current implementation note: old prototype mock data and course/vote UI have been removed from the active app. New frontend modules belong under `apps/web/frontend/features`; backend modules under `apps/web/backend`.

`packages/ui` is the shared design/component index for the MVP. It exports `Button`, `Badge`, `Surface`, `cn`, and a static `designSystem` object containing the color, font, radius, and primitive variant names mirrored from `apps/web/app/globals.css`. Keep this package limited to client-safe React primitives and static tokens.

## Backend Shape

Keep product orchestration inside `apps/web/backend` and Prisma/Postgres ownership inside `packages/db`. This keeps the repo a modular monolith: one deployable Next.js app, one shared database package, and no separate backend service until the product has a concrete reason for one.

Current target structure:

```txt
apps/web/
  app/
    questions/
      page.tsx
      [questionId]/page.tsx
    cxc-ai/
      page.tsx
      [chatId]/page.tsx
    api/
      questions/route.ts
      questions/[questionId]/answers/route.ts
      search/route.ts
      cxc-ai/route.ts
  frontend/
    features/
      questions/
      search/
      cxc-ai/
  backend/
    questions/
    answers/
    search/
    viewer/
    cxc-ai/
      agents/
      services/
      evals/
  shared/
    utils/
    data/
packages/db/
    prisma/
      schema.prisma
      migrations/
      seed.mjs
  src/
    index.ts
```

`apps/web/backend` may compose use cases and enforce app behavior. `packages/db` should stay focused on database access and schema-adjacent helpers; it should not import React, Next.js route objects, or browser code.

## Data Model Direction

Start with the smallest model set that supports the ask forum:

- `Question`: title, body, author display text, tags, answer count, created timestamp, last activity timestamp.
- `Answer`: body, author display text, question relation, and created/updated timestamps.
- `Tag`: stable slug and display label.
- `QuestionTag`: join table connecting questions to tags.
- `AiChatSession`: generic table for private CXC AI chat sessions. One chat has one ID.
- `AiChatMessage`: generic table for individual CXC AI messages. The AI SDK determines app-level message primitives.
- `AiChatSource`: generic table for source-labeled public questions/answers retrieved for a CXC AI response.

Use server-side validation at write boundaries. Client-visible DTOs should avoid leaking internal-only fields.

Courses are not part of the MVP data model. Do not add `Course`, pinned courses, course pages, or course-specific navigation unless that scope is explicitly reopened.

Do not add auth/profile/settings models yet. Better Auth, SUNet-backed profiles, user settings, roles/admins, reputation, votes, notifications, saved drafts, and autosave are later milestones.

## Search

Internal search should be Postgres-backed first:

- Search questions and answers.
- Rank title/tag matches above body-only matches.
- Support tag filters.
- Return enough metadata to render compact Stack Overflow-style result rows.

Do not introduce a separate search service until the Postgres implementation has a concrete limitation.

## CXC AI

CXC AI is optional and should not block the normal Q&A flow. Users must be able to post a question directly.

Expected behavior:

- Provide private Stanford-focused AI Q&A in full-page routes `/cxc-ai` and `/cxc-ai/[chatId]`.
- Use public CardinalXchange `Question` and `Answer` records and optional bounded web context.
- Source-label results when it uses retrieved material.
- Provide an `Ask the Community` tool that returns a transient draft title, body, and tags when the user wants human input.
- Keep API keys and web-scan credentials server-only.
- Keep a human in the loop: CXC AI may draft, but users must explicitly post anything public.
- Use the Vercel AI SDK for the chat UI and streaming response plumbing in the Next.js app.

CXC AI should be framed as its own full-page chat mode, not as a required first step, side panel, or inline helper inside the question form. The UI must say `CXC AI`; the database names remain generic `AiChatSession`, `AiChatMessage`, and `AiChatSource`.

Internal retrieval for CXC AI must be read-only and scoped to public `Question` and `Answer` records. It should not retrieve private chat history, drafts, auth/session data, or moderation data. Retrieved records should be capped, source-labeled, and passed through server-side controls before being used in a model call.

The `Ask the Community` tool must not save or publish a draft. It returns transient title/body/tags for user review, and the public forum write happens only if the user clicks `Post Question`.

The AI SDK does not replace the CardinalXchange persistence model. The AI SDK determines message primitives at the chat runtime/app boundary; CardinalXchange owns generic Prisma persistence through `AiChatSession`, `AiChatMessage`, and `AiChatSource`.

Implementation decision: use Prisma for CXC AI persistence. The AI SDK route should stream the model response, then save the completed assistant message, user message, retrieved sources, and session metadata through Prisma. The CXC AI page should load previous messages from Prisma and pass them into the AI SDK chat UI as initial state. One chat maps to one `AiChatSession` ID. Until SUNet auth exists, do not promise real user-specific history outside local/dev viewer behavior.

## Profile And Settings

Profile and settings should come after the core Q&A and CXC AI foundations. They require Better Auth/SUNet auth because user-specific pages and settings need a reliable viewer identity.

Initial profile/settings scope after auth:

- Public profile display.
- User's questions.
- User's answers.
- User's CXC AI chat sessions if persistence is enabled.
- Basic display/preferences settings.

Postpone roles, admins, reputation, votes, notifications, and admin controls until after this basic user surface exists.

## Local Dev

Current flow:

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Once Prisma is added, the expected flow becomes:

```bash
pnpm install
pnpm --filter @cardinalxchange/db prisma migrate dev
pnpm --filter @cardinalxchange/db prisma db seed
pnpm dev
```

Required local environment once the backend exists:

```txt
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=
```

Only require `OPENAI_API_KEY` for CXC AI; the base forum should continue to run without AI configured.

Do not add NextAuth, Stanford OAuth, or login-screen variables until authentication becomes an explicit milestone.

## Docker And Postgres

The repository currently has:

- `Dockerfile`: builds and runs the Next.js web app.
- `docker-compose.yml`: builds and starts only the web container.

When the Postgres work lands, compose should add a Postgres service and wire the web service with `DATABASE_URL`. Until then, docs should not claim that `docker compose up` provides a database.

Target local services:

```txt
web       Next.js app, port 3000
postgres  local development database, port 5432
```

Prisma migrations should be run explicitly during development and as part of deployment/release workflow, not hidden inside the app boot path.

## Vercel Deployment

Target deployment:

- Vercel hosts the `apps/web` Next.js app.
- Supabase Postgres stores CardinalXchange data.
- Prisma connects through `DATABASE_URL`.
- Prisma migrations should use `DIRECT_URL` when the runtime `DATABASE_URL` points at a pooled Supabase connection.
- Route handlers perform database reads/writes, internal search, and CXC AI calls.
- AI provider credentials are configured as server-only Vercel environment variables.

Recommended Vercel settings once backend code exists:

```txt
Framework Preset: Next.js
Root Directory: repository root
Build Command: pnpm build
Install Command: pnpm install --frozen-lockfile
Output: managed by Next.js/Vercel
```

Production migrations need an explicit workflow before launch. Do not rely on request-time schema changes.

## Guardrails

- Keep server-only code out of `packages/ui`.
- Keep backend routes in `apps/web/app/api` and use `apps/web/backend` for orchestration.
- Keep Prisma/Postgres details in `packages/db`.
- Use Prisma and Postgres as the initial persistence/search layer.
- Do not add auth-first architecture yet; the current MVP has no login screen.
- Do not add courses, pinned courses, votes, reputation, roles/admins, notifications, saved drafts, or autosave.
- Keep CXC AI full-page only at `/cxc-ai` and `/cxc-ai/[chatId]`.
- Restrict CXC AI retrieval to public questions and answers, with source-labeled results.
- Update `README.md` whenever implementation status or runbook steps change.
