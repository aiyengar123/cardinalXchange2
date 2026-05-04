# 01 · Organization

Target structure, naming conventions, and module boundaries. This file is the brief for the **Structure Proposer** agent and the contract that the Critic and Implementer enforce.

## Goals

- One obvious place for every kind of file.
- Feature-grouped folders, not type-grouped god directories.
- Every folder boundary has an `index.ts` barrel so imports are stable across refactors.
- Backend (`backend/`, `packages/db`) and frontend (`app/`, `frontend/features/`, `packages/ui`) never bleed into each other. Framework-free helpers live in `shared/` and may be imported from either side.

## Top-Level Tree (target)

```
apps/web/
  app/                         # Next.js App Router. Routes only — thin.
    (marketing)/               # route group for unauthenticated landing if added
    questions/
      page.tsx
      [questionId]/page.tsx
    ask/
      page.tsx
    cxc-ai/
      page.tsx
      [chatId]/page.tsx
    api/
      questions/route.ts
      questions/[questionId]/answers/route.ts
      search/route.ts
      cxc-ai/route.ts
    layout.tsx
    globals.css
  frontend/                    # umbrella for all client-side modules
    features/                  # feature-owned UI modules. The bulk of frontend lives here.
      questions/
        components/
          question-feed.tsx
          question-row.tsx
          question-detail.tsx
          answer-list.tsx
          answer-composer.tsx
        hooks/
          use-questions.ts
        types/
          questions.types.ts
        index.ts
      ask/
        components/
          ask-form.tsx
        hooks/
        types/
          ask.types.ts
        index.ts
      cxc-ai/
        components/
          chat-shell.tsx
          message-list.tsx
          message-composer.tsx
          source-pill.tsx
        hooks/
          use-cxc-chat.ts
        types/
          cxc.types.ts
        index.ts
      shell/                     # top command bar, left rail, page chrome
        components/
          top-command-bar.tsx
          topic-rail.tsx
          page-shell.tsx
        index.ts
  backend/                     # backend orchestration (no React) — was: server/
    questions/
      questions.service.ts
      questions.queries.ts
      questions.mutations.ts
      questions.types.ts
      index.ts
    answers/
      answers.service.ts
      answers.mutations.ts
      answers.types.ts
      index.ts
    search/
      search.service.ts
      search.queries.ts
      search.types.ts
      index.ts
    cxc-ai/
      agents/
        prompts/
          system.prompt.ts
          ask-the-community.prompt.ts
        cxc.agent.ts
      services/
        chat.service.ts
        retrieval.service.ts
        web-context.service.ts
      types/
        cxc.types.ts
      evals/                   # CXC AI eval suites land here
        README.md
      index.ts
    http/
      http.ts                  # HttpError, jsonError
      inputs.ts                # zod schemas / parsers
      contracts.ts             # DTOs shared with client
      index.ts
    viewer/                    # was: lib/ — viewer stub + future auth
      viewer.ts
      index.ts
    index.ts
  shared/                      # framework-free helpers + static data, importable from frontend or backend
    utils/                     # generic, pure helpers
      format-date.ts
      text.ts
      index.ts
    data/                      # static, build-time data (topic list, etc.)
      topics.data.ts
packages/
  db/
    prisma/
      schema.prisma
      migrations/
    src/
      client.ts                # PrismaClient singleton
      questions.queries.ts
      answers.queries.ts
      cxc.queries.ts
      types.ts                 # re-exports of generated Prisma types
      index.ts
  ui/                          # client-safe primitives only
    src/
      tokens/
        colors.ts
        spacing.ts
        radius.ts
        typography.ts
        index.ts
      primitives/
        button.tsx
        badge.tsx
        surface.tsx
        input.tsx
        textarea.tsx
        tag.tsx
        index.ts
      utils/
        cn.ts
      index.ts
  config/
    tsconfig/
      base.json
      next.json
      package.json
    eslint/
docs/
  build/                       # this directory
  architecture.md
```

## Naming Conventions

- **Files**: kebab-case. No PascalCase filenames.
- **Suffixes** (used as the *role* of the file, after the noun):
  - `*.types.ts` — types and zod schemas only.
  - `*.service.ts` — orchestration / use-case entry points (server only).
  - `*.queries.ts` — read functions against db.
  - `*.mutations.ts` — write functions against db.
  - `*.agent.ts` — composed AI agent (uses prompts + services).
  - `*.prompt.ts` — string templates only, no runtime logic.
  - `*.data.ts` — static literal data.
  - `*.hooks.ts` — react hooks (or `hooks/` folder with one hook per file).
- **Components**: kebab-case file, PascalCase export. One default-exported component per file.
- **Barrels**: every `frontend/features/*`, `backend/*`, `packages/*/src` boundary has an `index.ts`. No deep imports across these boundaries from outside the folder.

## Shared Types Policy

- Server-only types live in `apps/web/backend/<feature>/<feature>.types.ts`.
- Types crossing the wire (used by both server and client) live in `apps/web/backend/http/contracts.ts` and are imported via `@/backend/http`.
- Prisma-generated types are re-exported only from `@cardinalxchange/db`.
- `packages/ui` has its own `types/` for variant props; it must not import from `@/backend` or `@cardinalxchange/db`.

## Path Aliases

In `apps/web/tsconfig.json`:

```jsonc
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/app/*": ["./app/*"],
      "@/backend/*": ["./backend/*"],
      "@/frontend/*": ["./frontend/*"],
      "@/features/*": ["./frontend/features/*"],
      "@/utils/*": ["./shared/utils/*"],
      "@/data/*": ["./shared/data/*"]
    }
  }
}
```

External packages keep their `@cardinalxchange/*` ids.

## Boundary Rules (enforced in review, not tooling)

- `app/**` may import from `@/features/*`, `@/backend/*`, `@cardinalxchange/ui`, `@cardinalxchange/db` (only inside route handlers).
- `frontend/features/**` may import `@cardinalxchange/ui`, `@/utils/*`, `@/data/*`, `@/backend/http` (for DTO types only). **Never** `@cardinalxchange/db`.
- `backend/**` may import `@cardinalxchange/db`, `@/utils/*`. **Never** React, Next route objects beyond `NextResponse`, or `@cardinalxchange/ui`.
- `shared/**` is framework-free. **Never** React, Next, Prisma, or `@cardinalxchange/db` imports — both `frontend/` and `backend/` may import from `shared/`.
- `packages/ui/**` is client-safe. **Never** backend, db, or ai imports.

## Proposer / Critic / Implementer Contracts

### Proposer
- Read this file and `CLAUDE.md`.
- Re-open the image.
- Output `docs/build/proposals/structure-proposal.md` with the full tree and a one-line rationale per top-level folder. Note any deviations from this file with reasoning.

### Critic
- Read the proposal.
- Output `docs/build/proposals/structure-critique.md` listing each issue with severity (`block` / `nit`) and a suggested fix.
- Block-level issues: boundary violations, naming inconsistencies, missing barrels, single-file folders, and any folder that duplicates an existing one.

### Implementer
- Read both. Resolve all `block` issues. Write the empty skeleton (folders + `index.ts` placeholders that re-export `{}` or are empty `export {}`).
- `git mv` existing files to their new homes; never delete and recreate.
- Update path aliases. Run `pnpm typecheck` and fix only import paths until it passes.
- Do not implement features in this phase.

## Completion Note

(Filled in by the Implementer.)

```
## Completion Note
- What changed: 
- Open questions for next agent: 
- Image cross-check: 
```
