# Repository Structure

CardinalXchange is a **pnpm + Turbo monorepo** with one Next.js 16 app and three shared packages. Backend (route handlers, services, DB) and frontend (pages, components, hooks) live in the **same Next.js app** with folder boundaries enforcing the split — there's no separate backend service.

If you've worked in repos with a separate backend service (Express/FastAPI/Rails) plus a separate frontend SPA (Vite/CRA), this looks different. The boundaries are still strict, just folder-based instead of process-based.

## Top-Level Layout

```
cardinalXchange/
├── apps/
│   └── web/                      # the only deployable: a Next.js App Router app
├── packages/
│   ├── db/                       # Prisma schema + generated client + query helpers
│   ├── ui/                       # client-safe React primitives + design tokens
│   └── config/                   # shared TS / ESLint configs
├── docs/
│   ├── architecture.md           # canonical product + architecture spec
│   └── build/                    # build plan markdowns + per-task agent briefs
├── CLAUDE.md                     # AI agent instructions (treated as repo conventions)
├── README.md                     # human-facing overview
├── STRUCTURE.md                  # this file
├── docker-compose.yml            # local Postgres on :54322 + optional web container
├── package.json                  # root scripts + workspace + Turbo
├── pnpm-workspace.yaml           # apps/* + packages/*
├── pnpm-lock.yaml
├── turbo.json                    # Turbo task graph
└── tsconfig.json                 # repo-root TS config (extended by workspaces)
```

## `apps/web` — the Next.js App

```
apps/web/
├── app/                          # App Router. Routes only — thin.
│   ├── (forum)/                  # route group for the public Q&A surface
│   │   ├── layout.tsx            # PageShell with TopicRail, no SideRail, max-w-[1600px]
│   │   ├── page.tsx              # `/` redirects to /questions
│   │   ├── questions/
│   │   │   ├── page.tsx          # /questions feed
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── [questionId]/
│   │   │       ├── page.tsx      # /questions/[id] detail
│   │   │       ├── loading.tsx
│   │   │       └── error.tsx
│   │   ├── ask/
│   │   │   ├── page.tsx          # /ask form
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── tags/
│   │       ├── page.tsx          # /tags index grid
│   │       └── loading.tsx
│   ├── cxc-ai/                   # CXC AI chat (separate layout — chat-history rail)
│   │   ├── layout.tsx            # PageShell with TopicRail + ChatHistoryRail
│   │   ├── page.tsx              # /cxc-ai new chat
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── [chatId]/
│   │       └── page.tsx          # /cxc-ai/[id] resume
│   ├── api/                      # route handlers (the "backend" surface)
│   │   ├── questions/route.ts
│   │   ├── questions/[questionId]/route.ts
│   │   ├── questions/[questionId]/answers/route.ts
│   │   ├── search/route.ts
│   │   ├── cxc-ai/route.ts
│   │   ├── cxc-ai/chats/[chatId]/route.ts
│   │   └── cxc-ai/chats/[chatId]/messages/route.ts
│   ├── layout.tsx                # html/body/fonts only — no shell wrap here
│   ├── globals.css               # design tokens + Tailwind v4 @theme inline
│   └── fonts.ts                  # next/font/google: Inter (sans) + JetBrains Mono
├── features/                     # feature-owned UI modules — most frontend lives here
│   ├── questions/
│   │   ├── components/           # QuestionFeed, QuestionRow, QuestionDetail, AnswerList, AnswerComposer, Markdown
│   │   └── index.ts              # barrel
│   ├── ask/
│   │   ├── components/           # AskForm
│   │   └── index.ts
│   ├── cxc-ai/
│   │   ├── components/           # ChatShell, MessageList, PromptInput, ChatHistoryRail, CitationBubble, ToolChain, RelatedQuestions, Markdown
│   │   ├── hooks/                # use-cxc-chat, use-stick-to-bottom
│   │   └── index.ts
│   └── shell/
│       ├── components/           # PageShell, TopCommandBar, TopicRail, SideRail
│       └── index.ts
├── server/                       # app-local backend orchestration (no React)
│   ├── http/                     # HttpError, jsonError, jsonOk, zod inputs, wire DTO contracts
│   ├── questions/                # listQuestionsForFeed, getQuestionDetail, createQuestion, mappers, queries, mutations, types
│   ├── answers/                  # addAnswer, listAnswers, mutations, types
│   ├── search/                   # search.service, queries, types
│   ├── tags/                     # listTagsForIndex
│   └── cxc-ai/
│       ├── agents/
│       │   ├── prompts/          # system.prompt, ask-the-community.prompt
│       │   └── cxc.agent.ts      # composes prompt + retrieval + tools
│       ├── services/             # chat.service (streamCxcAiTurn), retrieval.service, web-context.service, citation-extraction.service, stream-registry
│       └── types/
├── lib/                          # tiny app-local stubs (e.g. getViewer)
├── data/                         # static build-time data (topics.data.ts)
├── utils/                        # generic pure helpers (no framework deps)
├── scripts/                      # dev/ops scripts (not bundled)
├── public/                       # static assets served from /
├── middleware.ts                 # Next middleware (currently minimal)
└── tsconfig.json                 # path aliases live here
```

### Path aliases

Defined in `apps/web/tsconfig.json`. Every import inside `apps/web` should use one of these instead of long relative paths:

| Alias | Resolves to |
|---|---|
| `@/*` | `apps/web/*` |
| `@/app/*` | `apps/web/app/*` |
| `@/features/*` | `apps/web/features/*` |
| `@/server/*` | `apps/web/server/*` |
| `@/lib/*` | `apps/web/lib/*` |
| `@/utils/*` | `apps/web/utils/*` |
| `@/data/*` | `apps/web/data/*` |

External packages keep their `@cardinalxchange/*` ids (`@cardinalxchange/db`, `@cardinalxchange/ui`).

## `packages/db` — Prisma Layer

```
packages/db/
├── prisma/
│   ├── schema.prisma             # Postgres models: Question, Answer, Tag, QuestionTag, AiChatSession, AiChatMessage, AiChatSource
│   ├── migrations/               # numbered migrations
│   └── seed.mjs                  # currently a no-op (project rule: empty DB is canonical)
├── prisma.config.ts              # resolves DIRECT_URL → DATABASE_URL → localhost fallback
├── src/
│   ├── client.ts                 # PrismaClient singleton with hot-reload guard
│   ├── db.types.ts               # generated record types + include shapes re-exported
│   ├── questions.queries.ts      # listQuestionRecords, getQuestionRecord, searchQuestionRecords, slugify, normalizeTagLabels
│   ├── questions.mutations.ts    # createQuestionRecord
│   ├── answers.queries.ts        # listAnswerRecords
│   ├── answers.mutations.ts      # createAnswerRecord
│   ├── cxc.queries.ts            # AiChatSession reads + searchInternalContext
│   ├── cxc.mutations.ts          # ensureAiChatSessionRecord, replaceAiChatSessionMessages
│   ├── tags.queries.ts           # listTagsWithCounts
│   └── index.ts                  # public barrel
└── package.json                  # scripts: db:push, prisma:dev, prisma:deploy, prisma:generate, prisma:validate
```

## `packages/ui` — Design System

Client-safe React primitives + static design tokens. **Never** imports from `apps/web/server`, `@cardinalxchange/db`, or any AI/auth code.

```
packages/ui/
├── src/
│   ├── tokens/                   # colors, radius, spacing, typography, index
│   ├── primitives/               # Button, Badge, Tag, Surface, Input, Textarea, IconButton, Divider, Pill
│   ├── utils/                    # cn (clsx wrapper)
│   └── index.ts                  # barrel exporting designSystem object + primitives
```

## `packages/config` — Shared TS Config

```
packages/config/
└── tsconfig/
    ├── base.json
    ├── next.json
    ├── react-library.json
    └── package.json
```

Consumed via `extends: "@cardinalxchange/config/tsconfig/<preset>.json"` in workspace tsconfigs.

## Naming Conventions

- **Files**: kebab-case. No PascalCase filenames.
- **Suffixes** describe the *role* of the file:
  - `*.types.ts` — types and Zod schemas only
  - `*.service.ts` — server-side orchestration / use-case entry points
  - `*.queries.ts` — read functions against the DB
  - `*.mutations.ts` — write functions against the DB
  - `*.agent.ts` — composed AI agent (prompt + retrieval + tools)
  - `*.prompt.ts` — string templates only, no runtime logic
  - `*.data.ts` — static literal data
  - `use-*.ts` — React hooks
- **Components**: kebab-case file, PascalCase export, one default-exported component per file.
- **Barrels**: every `features/*`, `server/*`, `packages/*/src` boundary has an `index.ts`. Imports from outside the folder go through it.

## Boundary Rules

These are enforced in code review, not by tooling. Do not break them:

| From | May import | May not import |
|---|---|---|
| `app/**` (route handlers + pages) | `@/features/*`, `@/server/*`, `@cardinalxchange/db` (only inside route handlers and server components), `@cardinalxchange/ui` | — |
| `features/**` | `@cardinalxchange/ui`, `@/utils/*`, `@/data/*`, `@/server/http` (DTOs only) | `@cardinalxchange/db`, `@/server/<feature>/*` internals |
| `server/**` | `@cardinalxchange/db`, `@/utils/*` | React, `@cardinalxchange/ui`, Next route objects beyond `NextResponse` |
| `packages/ui/**` | self only | server, db, ai, auth, anything outside the package |
| `packages/db/**` | Prisma client | React, Next, Zod for validation (validation lives in `server/http/inputs.ts`) |

## Where Things Live (cookbook)

**Adding a new product feature (e.g., bookmarks):**
1. Add Prisma model to `packages/db/prisma/schema.prisma` and run `prisma:dev`
2. Add `packages/db/src/bookmarks.queries.ts` and `bookmarks.mutations.ts`; export from `packages/db/src/index.ts`
3. Add wire DTO to `apps/web/server/http/contracts.ts`
4. Add Zod input parser to `apps/web/server/http/inputs.ts`
5. Add `apps/web/server/bookmarks/{bookmarks.service.ts, index.ts}`
6. Add route handler at `apps/web/app/api/bookmarks/route.ts` (10 lines: parse → service → DTO)
7. Add page route at `apps/web/app/(forum)/bookmarks/page.tsx` (server component calls service)
8. Add UI under `apps/web/features/bookmarks/components/`
9. If the rail needs an entry, edit `apps/web/data/topics.data.ts` and `apps/web/features/shell/components/topic-rail.tsx` `resolveActiveId`

**Adding a primitive used by 3+ features (e.g., Modal):**
1. Add to `packages/ui/src/primitives/modal.tsx`
2. Re-export from `packages/ui/src/primitives/index.ts` and `packages/ui/src/index.ts`
3. Consume via `@cardinalxchange/ui` (root barrel only, no deep imports)

**Adding a CXC AI tool:**
1. Define the tool in `apps/web/server/cxc-ai/agents/cxc.agent.ts`
2. If it needs a prompt, add `apps/web/server/cxc-ai/agents/prompts/<tool>.prompt.ts`
3. If the result must render in chat, parse it in `apps/web/features/cxc-ai/components/message-list.tsx`

## Equivalence Map (other-codebase → here)

If you're comparing to another codebase you've worked in:

| Other-codebase folder | CardinalXchange equivalent |
|---|---|
| `src/` | `apps/web/` (and `packages/*/src/`) |
| `routes/` | `apps/web/app/**/page.tsx` and `apps/web/app/api/**/route.ts` (folder-as-route, file-as-handler) |
| `components/` | `apps/web/features/<feature>/components/` + `packages/ui/src/primitives/` |
| `services/` | `apps/web/server/<feature>/<feature>.service.ts` |
| `controllers/` | `apps/web/app/api/**/route.ts` (Next route handlers) |
| `models/` | `packages/db/prisma/schema.prisma` |
| `repositories/` / `dao/` | `packages/db/src/*.queries.ts` and `*.mutations.ts` |
| `dto/` | `apps/web/server/http/contracts.ts` |
| `validators/` | `apps/web/server/http/inputs.ts` (Zod parsers) |
| `middleware/` | `apps/web/middleware.ts` (Next middleware) |
| `hooks/` | `apps/web/features/<feature>/hooks/` |
| `lib/` / `utils/` | `apps/web/utils/` (pure helpers) + `apps/web/lib/` (app stubs) |
| `assets/` | `apps/web/public/` (Next convention) |
| `config/` | `packages/config/` + `tsconfig.json` + `next.config.*` |
| `tests/` | (none yet — `pnpm test` is currently a `tsc --noEmit` alias) |
| `scripts/` / `bin/` | `apps/web/scripts/` |
| `dist/` | `apps/web/.next/` (gitignored, generated) |
| `evals/` | (none yet — would live in `apps/web/server/cxc-ai/evals/` if added) |
| `logs/` | (runtime only, streamed to stdout — not a checked-in folder) |

## Out Of Scope

Per `CLAUDE.md` and `docs/architecture.md`, these are explicitly NOT in the codebase yet and should not be added:

- Auth (NextAuth, SUNet OAuth, login screens)
- Courses, course pages, pinned courses
- Reputation, votes, notifications, admin/moderation
- Redis, Meilisearch/Elasticsearch, object storage, analytics
- Image upload flows
- Seed data / fixtures (empty DB is canonical)
- Search ranking beyond title/tag matches

## Common Commands

```bash
pnpm install
pnpm dev                            # turbo dev → next dev --turbopack on apps/web
pnpm build
pnpm typecheck
pnpm lint
pnpm test                           # currently aliased to typecheck per workspace

# Targeted
pnpm --filter @cardinalxchange/web dev
pnpm --filter @cardinalxchange/db prisma:dev
pnpm --filter @cardinalxchange/db prisma:generate
pnpm --filter @cardinalxchange/db prisma:studio    # DB GUI

# Local Postgres
docker compose up -d postgres
docker exec -it cardinalxchange-postgres psql -U postgres -d cardinalxchange
```

`docs/architecture.md` is the canonical product/architecture spec and supersedes this file when they disagree on intent. This file documents *layout*; that file documents *intent*.
