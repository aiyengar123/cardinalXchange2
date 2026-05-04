# Wave 6 Reorg Proposal — Frontend / Backend Surface Split

Author: Wave 6 Reorg Proposer
Inputs: `STRUCTURE.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/build/01-organization.md`, `docs/build/proposals/structure-{proposal,implementation}.md`, the user's verbatim concerns about the current layout.

> Status: **proposal only**. No file is moved by this document. The Implementer carries out the moves in a follow-up.

---

## 1. TL;DR

Pick **option (c) — Hybrid**. `app/`, `public/`, `middleware.ts`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, and `package.json` stay where Next.js requires them, at `apps/web/` root. Everything else collapses into two new top-level folders inside the web app — `apps/web/backend/` (server orchestration, http boundary, AI agents, viewer/auth stub, scripts, future evals) and `apps/web/frontend/` (feature modules, shared utils, static data, public-asset-adjacent helpers). The most consequential rename is `apps/web/server/` → `apps/web/backend/` (with everything currently in `apps/web/server/<feature>/` preserved underneath). Total path-aliases re-pointed: 5. No code logic changes; only `git mv` and import-path rewrites.

---

## 2. Target tree

Files marked `(new, empty)` are placeholders the Implementer creates. Existing files keep their content; only their path changes.

```
cardinalXchange/
├── apps/
│   └── web/
│       ├── app/                              # UNCHANGED — Next.js requires this path
│       │   ├── (forum)/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── ask/{page,loading,error}.tsx
│       │   │   ├── questions/
│       │   │   │   ├── {page,loading,error}.tsx
│       │   │   │   ├── ask/page.tsx          # legacy redirect stub
│       │   │   │   └── [questionId]/{page,loading,error}.tsx
│       │   │   └── tags/{page,loading}.tsx
│       │   ├── cxc-ai/
│       │   │   ├── {layout,page,loading,error}.tsx
│       │   │   └── [chatId]/page.tsx
│       │   ├── api/                          # route handlers — the HTTP edge of `backend/`
│       │   │   ├── questions/route.ts
│       │   │   ├── questions/[questionId]/route.ts
│       │   │   ├── questions/[questionId]/answers/route.ts
│       │   │   ├── search/route.ts
│       │   │   ├── cxc-ai/route.ts
│       │   │   ├── cxc-ai/chats/[chatId]/route.ts
│       │   │   ├── cxc-ai/chats/[chatId]/messages/route.ts
│       │   │   └── cxc-ai/chats/[chatId]/stream/route.ts
│       │   ├── layout.tsx
│       │   ├── globals.css
│       │   └── fonts.ts
│       │
│       ├── backend/                          # NEW — everything server-side except `app/api/*` routes
│       │   ├── http/                         # was: server/http/
│       │   │   ├── http.ts
│       │   │   ├── inputs.ts
│       │   │   ├── contracts.ts
│       │   │   └── index.ts
│       │   ├── questions/                    # was: server/questions/
│       │   │   ├── questions.service.ts
│       │   │   ├── questions.queries.ts
│       │   │   ├── questions.mutations.ts
│       │   │   ├── questions.mappers.ts
│       │   │   ├── questions.types.ts
│       │   │   └── index.ts
│       │   ├── answers/                      # was: server/answers/
│       │   │   ├── answers.service.ts
│       │   │   ├── answers.mutations.ts
│       │   │   ├── answers.types.ts
│       │   │   └── index.ts
│       │   ├── search/                       # was: server/search/
│       │   │   ├── search.service.ts
│       │   │   ├── search.queries.ts
│       │   │   ├── search.types.ts
│       │   │   └── index.ts
│       │   ├── tags/                         # was: server/tags/
│       │   │   ├── tags.service.ts
│       │   │   └── index.ts
│       │   ├── cxc-ai/                       # was: server/cxc-ai/
│       │   │   ├── agents/
│       │   │   │   ├── cxc.agent.ts
│       │   │   │   ├── research-subagent.agent.ts
│       │   │   │   ├── model-registry.ts
│       │   │   │   ├── prompts/
│       │   │   │   │   ├── system.prompt.ts
│       │   │   │   │   ├── ask-the-community.prompt.ts
│       │   │   │   │   └── index.ts
│       │   │   │   ├── tools/
│       │   │   │   │   └── task.tool.ts
│       │   │   │   └── index.ts
│       │   │   ├── services/
│       │   │   │   ├── chat.service.ts
│       │   │   │   ├── retrieval.service.ts
│       │   │   │   ├── web-context.service.ts
│       │   │   │   ├── citation-extraction.service.ts
│       │   │   │   ├── stream-registry.ts
│       │   │   │   └── index.ts
│       │   │   ├── types/
│       │   │   │   ├── cxc.types.ts
│       │   │   │   └── index.ts
│       │   │   ├── evals/                    # NEW (empty) — CXC AI eval suites land here
│       │   │   │   └── README.md             # 1-line note: "Add *.eval.ts files here. See docs/build/."
│       │   │   └── index.ts
│       │   ├── viewer/                       # was: lib/viewer.ts
│       │   │   ├── viewer.ts
│       │   │   └── index.ts
│       │   ├── scripts/                      # NEW — dev/ops scripts (was implicit; folder was empty)
│       │   │   └── .gitkeep                  # keeps folder when empty
│       │   └── index.ts                      # backend public barrel
│       │
│       ├── frontend/                         # NEW — features + shared front-end utilities
│       │   ├── features/                     # was: features/
│       │   │   ├── shell/
│       │   │   │   ├── components/
│       │   │   │   │   ├── page-shell.tsx
│       │   │   │   │   ├── side-rail.tsx
│       │   │   │   │   ├── top-command-bar.tsx
│       │   │   │   │   └── topic-rail.tsx
│       │   │   │   └── index.ts
│       │   │   ├── questions/
│       │   │   │   ├── components/
│       │   │   │   │   ├── answer-composer.tsx
│       │   │   │   │   ├── answer-list.tsx
│       │   │   │   │   ├── markdown.tsx
│       │   │   │   │   ├── question-detail.tsx
│       │   │   │   │   ├── question-feed.tsx
│       │   │   │   │   └── question-row.tsx
│       │   │   │   └── index.ts
│       │   │   ├── ask/
│       │   │   │   ├── components/ask-form.tsx
│       │   │   │   └── index.ts
│       │   │   └── cxc-ai/
│       │   │       ├── components/
│       │   │       │   ├── chat-history-rail.tsx
│       │   │       │   ├── chat-shell.tsx
│       │   │       │   ├── citation-bubble.tsx
│       │   │       │   ├── cited-text.tsx
│       │   │       │   ├── markdown.tsx
│       │   │       │   ├── message-list.tsx
│       │   │       │   ├── prompt-input.tsx
│       │   │       │   ├── related-questions.tsx
│       │   │       │   └── tool-chain.tsx
│       │   │       ├── hooks/
│       │   │       │   ├── use-cxc-chat.ts
│       │   │       │   └── use-stick-to-bottom.ts
│       │   │       └── index.ts
│       │   ├── utils/                        # was: utils/
│       │   │   └── index.ts
│       │   ├── data/                         # was: data/
│       │   │   ├── topics.data.ts
│       │   │   └── index.ts
│       │   └── index.ts                      # frontend public barrel (rarely imported; per-feature barrels are the usual entry)
│       │
│       ├── public/                           # UNCHANGED — Next.js requires this path
│       ├── middleware.ts                     # UNCHANGED — Next.js requires this path
│       ├── next.config.ts                    # UNCHANGED
│       ├── next-env.d.ts                     # UNCHANGED
│       ├── postcss.config.mjs                # UNCHANGED
│       ├── package.json                      # UNCHANGED
│       └── tsconfig.json                     # paths block updated (see §7)
│
├── packages/                                 # UNCHANGED in shape; per-package detail unchanged.
│   ├── db/
│   │   ├── prisma/{schema.prisma,migrations,seed.mjs}
│   │   ├── prisma.config.ts
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── db.types.ts
│   │   │   ├── questions.{queries,mutations}.ts
│   │   │   ├── answers.{queries,mutations}.ts
│   │   │   ├── cxc.{queries,mutations}.ts
│   │   │   ├── tags.queries.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/
│   │   └── src/
│   │       ├── tokens/{colors,radius,spacing,typography,index}.ts
│   │       ├── primitives/{badge,button,divider,icon-button,input,pill,surface,tag,textarea,index}.tsx
│   │       ├── utils/{cn,index}.ts
│   │       └── index.ts
│   └── config/
│       └── tsconfig/{base.json,next.json,package.json}
│
├── docs/
│   ├── architecture.md
│   └── build/
│       ├── 00-orchestration.md … 04-design.md
│       ├── README.md
│       ├── tasks/
│       └── proposals/
│           ├── wave-6-proposal.md            # this file
│           └── (other wave 1-5 artifacts)
│
├── CLAUDE.md
├── README.md
├── STRUCTURE.md                              # to be updated by Implementer/Documenter after the move lands
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

Every folder boundary above ends in an `index.ts` barrel. The Implementer should create barrels in any new directory that doesn't yet have one (`backend/`, `backend/scripts/`, `backend/viewer/`, `backend/cxc-ai/evals/`, `frontend/`, `frontend/utils/`, `frontend/data/`).

---

## 3. Per-change rationale

### 3.1 `server/` → `backend/`

**What:** The single most consequential rename. Every directory currently under `apps/web/server/` keeps its internal layout exactly and moves wholesale to `apps/web/backend/`. **Why:** The user's mental model assumed a separate backend service. We can't deliver that without splitting the deployable, but renaming `server/` to `backend/` makes the surface immediately recognizable to anyone reading the tree top-down. **Benefit:** When a contributor opens `apps/web/`, the two top-level non-Next folders are literally named `backend/` and `frontend/`. The Equivalence Map row "`services/` → `apps/web/server/<feature>/<feature>.service.ts`" becomes "`services/` → `apps/web/backend/<feature>/<feature>.service.ts`" — same file, more obvious folder.

### 3.2 `features/`, `utils/`, `data/` → `frontend/{features,utils,data}/`

**What:** Three sibling top-level folders collapse under one `frontend/` umbrella. **Why:** Currently `features/` is the bulk of the frontend, but `utils/` and `data/` (also frontend-only — `utils` is "framework-free helpers", `data` is "static literal data" consumed by features) live as peers, which makes the top of `apps/web/` look like 7+ folders of unclear ownership. Moving them under `frontend/` makes the split symmetric with `backend/` and gives `frontend/` an obvious home. **Benefit:** Top of `apps/web/` shrinks from `app, data, features, lib, server, utils, scripts, public` (8) to `app, backend, frontend, public` (4). The user asked for an "obvious frontend/backend split"; this is what makes it obvious.

### 3.3 `lib/viewer.ts` → `backend/viewer/viewer.ts`

**What:** The `lib/` folder (a single-file folder containing the viewer stub) goes away. Its one file moves under `backend/viewer/`. **Why:** `getViewer` is server-only (it reads `process.env.DEV_VIEWER_*`), so it conceptually belongs with `backend/`. The current `lib/` was carrying the Equivalence-Map smell of "tiny app-local stubs" that is also the only single-file folder at the web-app top level. **Benefit:** Eliminates one top-level folder; co-locates the viewer with the rest of server-side code; future auth wiring (the Last Milestone) lands cleanly in `backend/viewer/` rather than re-opening `lib/`.

### 3.4 New `backend/cxc-ai/evals/`

**What:** New empty folder (with a 1-line README so it isn't pruned by future "delete empty folders" passes). **Why:** The user explicitly listed `evals/` as something they expect to see. The Equivalence Map already documents `evals/` as belonging at `apps/web/server/cxc-ai/evals/` if added. We're documenting the location now so the first eval suite has an obvious home. **Benefit:** Resolves the "where do CXC AI evals go" question once. The folder is empty but discoverable.

### 3.5 New `backend/scripts/`

**What:** Move the (currently empty / not-yet-created) `scripts/` folder under `backend/`. The current `STRUCTURE.md` documents `apps/web/scripts/` but no such folder exists on disk today. **Why:** Dev/ops scripts are operational tooling — they call into `backend/` services and `packages/db`, not into UI. Putting them under `backend/scripts/` rather than `apps/web/scripts/` keeps the top-level clean and makes the dependency direction obvious. **Benefit:** When `check-env.ts` or a migration helper lands, it has a home that doesn't add a new top-level folder.

### 3.6 Path alias renames

`@/server/*` → `@/backend/*`. `@/features/*` → `@/frontend/features/*`. `@/utils/*` → `@/frontend/utils/*`. `@/data/*` → `@/frontend/data/*`. `@/lib/*` is removed (its only consumer becomes `@/backend/viewer`). `@/app/*` and `@/*` are unchanged. Detail in §7.

---

## 4. What's NOT changing and why

| Path | Why it stays |
|---|---|
| `apps/web/app/` | Next.js App Router requires this exact path. |
| `apps/web/app/api/*` | Same — route handlers are folder-as-route. |
| `apps/web/public/` | Next.js requires `public/` at the app root. |
| `apps/web/middleware.ts` | Next.js requires `middleware.ts` at the app root. |
| `apps/web/next.config.ts`, `next-env.d.ts`, `postcss.config.mjs`, `tsconfig.json`, `package.json` | Tooling config; Next/TS resolve them by convention from the app root. |
| `packages/db`, `packages/ui`, `packages/config` | Boundary rules and package identities are unchanged. The user's complaint is about `apps/web/` shape, not the package layout. |
| Naming conventions (`*.service.ts`, `*.queries.ts`, `*.mutations.ts`, `*.agent.ts`, `*.prompt.ts`, `*.types.ts`, `*.data.ts`, `use-*.ts`) | Wave-1 invariant; preserved verbatim. |
| Per-feature barrels (`index.ts` at every boundary) | Wave-1 invariant; preserved verbatim. |
| Boundary rules (`packages/ui` client-safe, `packages/db` Prisma-only, etc.) | Wave-1 invariant; preserved verbatim. |
| Route surface (`/questions`, `/ask`, `/cxc-ai`, `/cxc-ai/[chatId]`, `/api/...`) | No URL changes. |
| File contents | This is a **structural** reorg. Implementation is `git mv` + import-path rewrites only. |

---

## 5. User's wishlist mapping

The user listed folders from a separate-backend + SPA codebase. Some map cleanly; some don't apply to a Next.js monorepo. Each item is mapped or skipped with reasoning.

| User-listed item | Where it lives in this proposal | Notes |
|---|---|---|
| **source / src** | `apps/web/` is the equivalent; `packages/*/src/` for packages. | Next convention is no `src/` at the app root. Adding one would force `app/`, `public/`, `middleware.ts` to move into it, which Next supports but loses the "thin app root" benefit — and the user's actual concern (frontend/backend visibility) is solved by `backend/` + `frontend/`. |
| **features** | `apps/web/frontend/features/` | Direct mapping; only the parent path changes. |
| **dist** | `apps/web/.next/` (gitignored, generated). | Not a checked-in folder. Listed in `.gitignore`. |
| **lib** | Removed as a top-level folder. The one file (`viewer.ts`) moves to `apps/web/backend/viewer/`. | The previous `lib/` was a single-file folder which the brief explicitly discourages. |
| **scripts** | `apps/web/backend/scripts/` | New location. Currently `apps/web/scripts/` is documented but does not exist on disk. |
| **utils** | `apps/web/frontend/utils/` | Frontend-only generic helpers. Server-side helpers (if any) live next to the service that needs them, or in `backend/<feature>/`. |
| **types** (top-level) | Skipped as a top-level folder. | Per Wave-1: types live next to the file that owns them as `*.types.ts`. Wire DTOs go in `backend/http/contracts.ts`. Prisma types come from `@cardinalxchange/db`. A top-level `types/` would re-introduce the type-grouped god directory we just dismantled. |
| **assets** | `apps/web/public/` | Next convention. Static assets like SVG/PNG go in `public/`. CSS tokens stay in `app/globals.css`. |
| **middleware** | `apps/web/middleware.ts` (existing) | Next requires this exact path; cannot move. |
| **routes** | `apps/web/app/(forum)/**/page.tsx` and `apps/web/app/api/**/route.ts` | Folder-as-route. Cannot collapse into a flat `routes/` folder under Next App Router. |
| **components** | `apps/web/frontend/features/<feature>/components/` and `packages/ui/src/primitives/` | Per Wave-1: feature-scoped, not type-grouped. There is intentionally no top-level `components/`. |
| **configs** | `packages/config/` + root `tsconfig.json` + `next.config.ts` + `eslint.config.mjs` | Already factored. |
| **api** | `apps/web/app/api/` | Cannot move — Next requirement. |
| **hooks** | `apps/web/frontend/features/<feature>/hooks/` | Hooks are feature-scoped. No top-level `hooks/` folder. |
| **libs** (backend, in user's list) | Map to `apps/web/backend/<feature>/` and `packages/db`. | "libs" is the user's word for what we call `backend/` + `packages/db` — server-side code organized by domain. |
| **context** | Skipped as a folder. | React context lives next to the feature that owns it (e.g., `frontend/features/cxc-ai/context/<name>.context.tsx` if/when needed). No top-level `context/` folder. |
| **fonts** | `apps/web/app/fonts.ts` (existing, `next/font/google`) + `app/globals.css`. | Fonts at app root is Next convention; not a separate folder. |
| **evals** (CXC AI) | `apps/web/backend/cxc-ai/evals/` | New empty folder, documented as the home for AI eval suites. |
| **operations / features grouped with backend with route + service files** | `apps/web/backend/<feature>/{<feature>.service.ts, .queries.ts, .mutations.ts, .types.ts, index.ts}` paired with `apps/web/app/api/<feature>/route.ts` | This is exactly the current pattern, just renamed `server/` → `backend/`. The route file is the HTTP handler; the service file is the orchestration. |
| **bins** | Skipped. | "bins" is for compiled executables; Next.js doesn't produce them. The closest analog is `pnpm <script>` entries which live in `package.json`. |
| **includes** | Skipped. | C/C++/PHP idiom; no analog in TS/Next. Shared types use `import` from `*.types.ts`. |
| **logs** | Skipped. | Logs stream to stdout (Vercel/Docker captures them). Not a checked-in folder. |
| **register.js** | Skipped. | Node `--require` hooks aren't used here. Next handles transforms via Turbopack/SWC. If we ever need it, it'd live in `apps/web/backend/scripts/`. |
| **BTS files** | Skipped — see Open Questions §9.1. | "BTS" is ambiguous (Behind-The-Scenes? Build-Time-Scripts? Bun-TypeScript?). Best-guess interpretations are flagged for the user. |
| **docs** (backend-side) | `docs/architecture.md`, `docs/build/`, `STRUCTURE.md`, `CLAUDE.md`, `README.md`. | Already factored at the repo root. |

---

## 6. Move map (`git mv` semantics)

All paths are absolute-relative to the repo root. No file content changes; only paths move. Where a directory has many files, the directory is moved as a unit (`git mv <old>/ <new>/`) and individual files are listed for clarity.

### 6.1 Server → backend

| from | to |
|---|---|
| `apps/web/server/` | `apps/web/backend/` |
| `apps/web/server/http/http.ts` | `apps/web/backend/http/http.ts` |
| `apps/web/server/http/inputs.ts` | `apps/web/backend/http/inputs.ts` |
| `apps/web/server/http/contracts.ts` | `apps/web/backend/http/contracts.ts` |
| `apps/web/server/http/index.ts` | `apps/web/backend/http/index.ts` |
| `apps/web/server/questions/questions.service.ts` | `apps/web/backend/questions/questions.service.ts` |
| `apps/web/server/questions/questions.queries.ts` | `apps/web/backend/questions/questions.queries.ts` |
| `apps/web/server/questions/questions.mutations.ts` | `apps/web/backend/questions/questions.mutations.ts` |
| `apps/web/server/questions/questions.mappers.ts` | `apps/web/backend/questions/questions.mappers.ts` |
| `apps/web/server/questions/questions.types.ts` | `apps/web/backend/questions/questions.types.ts` |
| `apps/web/server/questions/index.ts` | `apps/web/backend/questions/index.ts` |
| `apps/web/server/answers/answers.service.ts` | `apps/web/backend/answers/answers.service.ts` |
| `apps/web/server/answers/answers.mutations.ts` | `apps/web/backend/answers/answers.mutations.ts` |
| `apps/web/server/answers/answers.types.ts` | `apps/web/backend/answers/answers.types.ts` |
| `apps/web/server/answers/index.ts` | `apps/web/backend/answers/index.ts` |
| `apps/web/server/search/search.service.ts` | `apps/web/backend/search/search.service.ts` |
| `apps/web/server/search/search.queries.ts` | `apps/web/backend/search/search.queries.ts` |
| `apps/web/server/search/search.types.ts` | `apps/web/backend/search/search.types.ts` |
| `apps/web/server/search/index.ts` | `apps/web/backend/search/index.ts` |
| `apps/web/server/tags/tags.service.ts` | `apps/web/backend/tags/tags.service.ts` |
| `apps/web/server/tags/index.ts` | `apps/web/backend/tags/index.ts` |
| `apps/web/server/cxc-ai/index.ts` | `apps/web/backend/cxc-ai/index.ts` |
| `apps/web/server/cxc-ai/agents/cxc.agent.ts` | `apps/web/backend/cxc-ai/agents/cxc.agent.ts` |
| `apps/web/server/cxc-ai/agents/research-subagent.agent.ts` | `apps/web/backend/cxc-ai/agents/research-subagent.agent.ts` |
| `apps/web/server/cxc-ai/agents/model-registry.ts` | `apps/web/backend/cxc-ai/agents/model-registry.ts` |
| `apps/web/server/cxc-ai/agents/index.ts` | `apps/web/backend/cxc-ai/agents/index.ts` |
| `apps/web/server/cxc-ai/agents/prompts/system.prompt.ts` | `apps/web/backend/cxc-ai/agents/prompts/system.prompt.ts` |
| `apps/web/server/cxc-ai/agents/prompts/ask-the-community.prompt.ts` | `apps/web/backend/cxc-ai/agents/prompts/ask-the-community.prompt.ts` |
| `apps/web/server/cxc-ai/agents/prompts/index.ts` | `apps/web/backend/cxc-ai/agents/prompts/index.ts` |
| `apps/web/server/cxc-ai/agents/tools/task.tool.ts` | `apps/web/backend/cxc-ai/agents/tools/task.tool.ts` |
| `apps/web/server/cxc-ai/services/chat.service.ts` | `apps/web/backend/cxc-ai/services/chat.service.ts` |
| `apps/web/server/cxc-ai/services/retrieval.service.ts` | `apps/web/backend/cxc-ai/services/retrieval.service.ts` |
| `apps/web/server/cxc-ai/services/web-context.service.ts` | `apps/web/backend/cxc-ai/services/web-context.service.ts` |
| `apps/web/server/cxc-ai/services/citation-extraction.service.ts` | `apps/web/backend/cxc-ai/services/citation-extraction.service.ts` |
| `apps/web/server/cxc-ai/services/stream-registry.ts` | `apps/web/backend/cxc-ai/services/stream-registry.ts` |
| `apps/web/server/cxc-ai/services/index.ts` | `apps/web/backend/cxc-ai/services/index.ts` |
| `apps/web/server/cxc-ai/types/cxc.types.ts` | `apps/web/backend/cxc-ai/types/cxc.types.ts` |
| `apps/web/server/cxc-ai/types/index.ts` | `apps/web/backend/cxc-ai/types/index.ts` |
| `apps/web/server/index.ts` | `apps/web/backend/index.ts` |

### 6.2 Lib → backend/viewer

| from | to |
|---|---|
| `apps/web/lib/viewer.ts` | `apps/web/backend/viewer/viewer.ts` |
| `apps/web/lib/index.ts` | `apps/web/backend/viewer/index.ts` |

### 6.3 Features / utils / data → frontend/

| from | to |
|---|---|
| `apps/web/features/` | `apps/web/frontend/features/` |
| `apps/web/features/shell/components/page-shell.tsx` | `apps/web/frontend/features/shell/components/page-shell.tsx` |
| `apps/web/features/shell/components/side-rail.tsx` | `apps/web/frontend/features/shell/components/side-rail.tsx` |
| `apps/web/features/shell/components/top-command-bar.tsx` | `apps/web/frontend/features/shell/components/top-command-bar.tsx` |
| `apps/web/features/shell/components/topic-rail.tsx` | `apps/web/frontend/features/shell/components/topic-rail.tsx` |
| `apps/web/features/shell/index.ts` | `apps/web/frontend/features/shell/index.ts` |
| `apps/web/features/questions/components/answer-composer.tsx` | `apps/web/frontend/features/questions/components/answer-composer.tsx` |
| `apps/web/features/questions/components/answer-list.tsx` | `apps/web/frontend/features/questions/components/answer-list.tsx` |
| `apps/web/features/questions/components/markdown.tsx` | `apps/web/frontend/features/questions/components/markdown.tsx` |
| `apps/web/features/questions/components/question-detail.tsx` | `apps/web/frontend/features/questions/components/question-detail.tsx` |
| `apps/web/features/questions/components/question-feed.tsx` | `apps/web/frontend/features/questions/components/question-feed.tsx` |
| `apps/web/features/questions/components/question-row.tsx` | `apps/web/frontend/features/questions/components/question-row.tsx` |
| `apps/web/features/questions/index.ts` | `apps/web/frontend/features/questions/index.ts` |
| `apps/web/features/ask/components/ask-form.tsx` | `apps/web/frontend/features/ask/components/ask-form.tsx` |
| `apps/web/features/ask/index.ts` | `apps/web/frontend/features/ask/index.ts` |
| `apps/web/features/cxc-ai/components/chat-history-rail.tsx` | `apps/web/frontend/features/cxc-ai/components/chat-history-rail.tsx` |
| `apps/web/features/cxc-ai/components/chat-shell.tsx` | `apps/web/frontend/features/cxc-ai/components/chat-shell.tsx` |
| `apps/web/features/cxc-ai/components/citation-bubble.tsx` | `apps/web/frontend/features/cxc-ai/components/citation-bubble.tsx` |
| `apps/web/features/cxc-ai/components/cited-text.tsx` | `apps/web/frontend/features/cxc-ai/components/cited-text.tsx` |
| `apps/web/features/cxc-ai/components/markdown.tsx` | `apps/web/frontend/features/cxc-ai/components/markdown.tsx` |
| `apps/web/features/cxc-ai/components/message-list.tsx` | `apps/web/frontend/features/cxc-ai/components/message-list.tsx` |
| `apps/web/features/cxc-ai/components/prompt-input.tsx` | `apps/web/frontend/features/cxc-ai/components/prompt-input.tsx` |
| `apps/web/features/cxc-ai/components/related-questions.tsx` | `apps/web/frontend/features/cxc-ai/components/related-questions.tsx` |
| `apps/web/features/cxc-ai/components/tool-chain.tsx` | `apps/web/frontend/features/cxc-ai/components/tool-chain.tsx` |
| `apps/web/features/cxc-ai/hooks/use-cxc-chat.ts` | `apps/web/frontend/features/cxc-ai/hooks/use-cxc-chat.ts` |
| `apps/web/features/cxc-ai/hooks/use-stick-to-bottom.ts` | `apps/web/frontend/features/cxc-ai/hooks/use-stick-to-bottom.ts` |
| `apps/web/features/cxc-ai/index.ts` | `apps/web/frontend/features/cxc-ai/index.ts` |
| `apps/web/utils/index.ts` | `apps/web/frontend/utils/index.ts` |
| `apps/web/data/topics.data.ts` | `apps/web/frontend/data/topics.data.ts` |

### 6.4 New empty files / barrels

| path | contents |
|---|---|
| `apps/web/backend/index.ts` | rename of existing `server/index.ts`; no content change |
| `apps/web/backend/viewer/index.ts` | `export * from "./viewer";` (rewrite of existing `lib/index.ts`) |
| `apps/web/backend/scripts/.gitkeep` | empty (placeholder; folder is currently undocumented in tree) |
| `apps/web/backend/cxc-ai/evals/README.md` | 1 line: `# CXC AI Evals — add *.eval.ts files here. See docs/architecture.md.` |
| `apps/web/frontend/index.ts` | `export {};` (placeholder; per-feature barrels are the typical entry) |
| `apps/web/frontend/utils/index.ts` | rename of existing `utils/index.ts`; no content change |
| `apps/web/frontend/data/index.ts` | `export * from "./topics.data";` (new — `data/` had no barrel) |

### 6.5 Files NOT moved (sanity check)

`apps/web/app/**`, `apps/web/public/`, `apps/web/middleware.ts`, `apps/web/next.config.ts`, `apps/web/next-env.d.ts`, `apps/web/postcss.config.mjs`, `apps/web/package.json`, `apps/web/tsconfig.json` (content updates only — see §7), all of `packages/**`, all of `docs/**`, all root-level files.

---

## 7. Path-alias updates

Diff against current `apps/web/tsconfig.json`:

```diff
 {
   "extends": "@cardinalxchange/config/tsconfig/next.json",
   "compilerOptions": {
     "paths": {
       "@/*": ["./*"],
       "@/app/*": ["./app/*"],
-      "@/features/*": ["./features/*"],
-      "@/server/*": ["./server/*"],
-      "@/lib/*": ["./lib/*"],
-      "@/utils/*": ["./utils/*"],
-      "@/data/*": ["./data/*"]
+      "@/backend/*": ["./backend/*"],
+      "@/frontend/*": ["./frontend/*"],
+      "@/features/*": ["./frontend/features/*"],
+      "@/utils/*":    ["./frontend/utils/*"],
+      "@/data/*":     ["./frontend/data/*"]
     }
   },
   "include": [
     "next-env.d.ts",
     "**/*.ts",
     "**/*.tsx",
     ".next/types/**/*.ts",
     ".next/dev/types/**/*.ts"
   ],
   "exclude": ["node_modules"]
 }
```

Notes on the alias choices:

- `@/backend/*` is the canonical name for the new path.
- `@/frontend/*` is added for completeness but seldom used (per-feature barrels are normally how features are imported).
- `@/features/*`, `@/utils/*`, `@/data/*` are kept as **convenience aliases** that resolve into the new `frontend/` location. This means existing imports do **not** need to change for these three aliases — only `@/server/*` → `@/backend/*` and `@/lib/*` removal require codemod-style rewrites.
- `@/lib/*` is removed. The single consumer site (`getViewer`) gets rewritten to import from `@/backend/viewer`. Estimated 1–3 import sites.

Import-rewrite scope (Implementer codemod): replace `@/server/` → `@/backend/` repo-wide in `apps/web/`. Replace `@/lib/viewer` → `@/backend/viewer/viewer` (or `@/backend/viewer`) repo-wide.

---

## 8. Estimated risk

| Risk | Likelihood | Mitigation |
|---|---|---|
| Dynamic imports (`import("@/server/...")`) won't auto-rewrite if any exist. | Low — code search of `apps/web/` shows no dynamic imports of server paths today. | Implementer greps `import\(` and `require\(` in `apps/web/` before declaring done. |
| Stale `.next/types` cache references the old path and breaks `pnpm typecheck`. | Medium — this happened in Wave 1. | Implementer runs `rm -rf apps/web/.next` before `pnpm typecheck`. |
| `next.config.ts` references file paths. | Low — current `next.config.ts` is 11 lines and references no relative paths. | Verified by reading file; no action needed. |
| `prisma.config.ts` uses repo-relative paths. | Low — file lives in `packages/db/` and points at its sibling `prisma/`. | No move under `packages/`; no action needed. |
| Generated Prisma client output. | Zero — Prisma generates into `node_modules/.prisma`; not affected by our moves. | No action needed. |
| ESLint `eslint.config.mjs` has folder-specific overrides. | Low — current config is generic. | Implementer greps for `server`, `features`, `lib`, `data`, `utils` in `eslint.config.mjs` and renames if any matches found. |
| Vercel deployment expects `apps/web/server` somewhere in build artifacts. | Zero — Vercel only cares about `apps/web/.next/` output. | No action. |
| Docker `Dockerfile` copies specific paths. | Low — `Dockerfile` should `COPY` whole `apps/` and `packages/`, not specific subpaths. | Implementer reads `Dockerfile` and confirms; if it lists `apps/web/server`, update. |
| `docker-compose.yml` mounts/binds. | Low. | Same — read and confirm. |
| External documentation (`STRUCTURE.md`, `README.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/build/01-organization.md`) references the old paths. | High — guaranteed. | Documentation update is a follow-up task, not part of the structural reorg. The Implementer flags which docs need an update; the Documenter agent (or this same agent in a second pass) updates them. |
| `pnpm test` / `pnpm typecheck` regressions. | Low if alias updates are done atomically with moves. | Implementer commits the path-alias change in the same commit as the file moves so the repo is never in a half-renamed state. |
| Boundary-rule drift. | Low — moves don't change any import edges, only path strings. | The Critic / reviewer reads §9 of `STRUCTURE.md` against the new tree to confirm boundaries are unchanged. |

---

## 9. Open questions

### 9.1 "BTS files" (user-listed; ambiguous)

The user said: "We also need middleware.ts and register.js, and BTS files." We can't find a definition. Best-guess interpretations, none committed in this proposal:

1. **"Behind-the-Scenes" files** — i.e., infrastructure/config like `Dockerfile`, `docker-compose.yml`, `.env.example`. These already exist at the repo root.
2. **"Build-Time Scripts"** — TypeScript files run via `pnpm` for codegen, env-checks, etc. Proposed home: `apps/web/backend/scripts/`.
3. **"Bun-TypeScript files"** — i.e., `*.bts` extension. The repo doesn't use Bun; this would be a new toolchain.
4. **A typo for "BFF" (Backend-For-Frontend)** — the entire `apps/web/backend/` is the BFF for `apps/web/app/` already; nothing additional to add.

**Recommendation:** flag back to user before the Implementer creates anything `BTS`-named. If interpretation (2) wins, it's already covered by `backend/scripts/`. The user should clarify.

### 9.2 `STRUCTURE.md` rewrite scope

Once the moves land, `STRUCTURE.md` needs a near-complete rewrite (every path mentioned changes). Scope: a Documenter pass after the Implementer is done. **Recommendation:** the Implementer leaves `STRUCTURE.md` untouched in the move commit; a follow-up commit titled "wave 6: docs" updates `STRUCTURE.md`, `README.md`, `CLAUDE.md`, `docs/architecture.md`, and `docs/build/01-organization.md`.

### 9.3 Whether to keep `frontend/` as a top-level wrapper or just rename `features/` to `frontend/`

The proposal puts `features/`, `utils/`, and `data/` all under `frontend/`. An alternative is to rename only `features/` → `frontend/` (so `frontend/` *is* the feature folder) and leave `utils/` and `data/` at the top level. **Recommendation:** keep the wrapper. The user's specific complaint was about top-level folder count; collapsing 3 → 1 helps more than renaming 1.

### 9.4 Whether to add `apps/web/backend/db/` re-export shim

Some contributors expect to write `import { prisma } from "@/backend/db"`. Currently you write `import { prisma } from "@cardinalxchange/db"`. **Recommendation:** do **not** add a shim. The package id is part of the boundary contract; an alias would let `apps/web/frontend/` accidentally `import` from `@/backend/db` and break the rule. Skip.

### 9.5 The user's mention of `routes/` and `api/` as separate folders

The user listed both. In Next.js, page routes live in `app/` and API routes live in `app/api/`. They cannot be split into top-level peers without leaving the App Router. **Recommendation:** treat `routes/` and `api/` as semantically already present (`app/` for pages, `app/api/` for handlers) and add a 1-line note in the next `STRUCTURE.md` revision making that explicit.

### 9.6 `register.js`

Skipped per §5. If the user has a specific use case (Sentry registration, OpenTelemetry init, etc.), Next supports `instrumentation.ts` at the app root for that purpose — the user may have meant this. **Recommendation:** if a future task requires runtime instrumentation, add `apps/web/instrumentation.ts` (Next convention) rather than `register.js`. Not in scope for this proposal.

### 9.7 Whether `app/api/` should logically be under `backend/`

It can't move — Next requires it at `app/api/*`. The proposal handles this with documentation: route handlers under `app/api/` are the **HTTP edge** of `backend/`; they should be 10-line files that call into `@/backend/<feature>` services. The current code already follows this pattern. **Recommendation:** add a 1-paragraph note to the new `STRUCTURE.md` clarifying that `app/api/` is part of "backend" semantically even though it lives in `app/`.

---

End of proposal. The Implementer should not begin work until a Critic pass (or direct user sign-off) accepts §1, §3, and §6 — those are the load-bearing decisions.
