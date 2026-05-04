# Wave 6 Reorg Critique

Reviewer: Wave 6 Reorg Critic
Inputs: `docs/build/proposals/wave-6-proposal.md`, `STRUCTURE.md`, `CLAUDE.md`, `docs/build/01-organization.md`, current tree on disk.

---

## 1. Verdict

**accept with required changes**

The proposal's central decision (`server/` → `backend/`, plus `features/` + `utils/` + `data/` → `frontend/{features,utils,data}/`) preserves every Wave-1 invariant and survives a literal grep against the current tree. There are, however, three load-bearing oversights the proposal misses outright (most importantly: a Tailwind `@source` rewrite the build pipeline depends on), one path-existence error in §4, and a few smaller items the Implementer must resolve before any `git mv` runs. Once §2 below is addressed, the moves themselves are mechanical.

Counts: **3 block / 6 nit** issues, **2 hallucinations** caught.

---

## 2. Block-level issues

### B1. Tailwind `@source` directives in `apps/web/app/globals.css` are not addressed (BREAKS BUILD)

- **Where:** `apps/web/app/globals.css` lines 3–4
  ```css
  @source "../features";
  @source "../lib";
  ```
- **Rule violated / risk:** The proposal's risk table (§8) inspects `next.config.ts`, `prisma.config.ts`, `eslint.config.mjs`, `Dockerfile`, and `docker-compose.yml`, but never mentions `globals.css`. After the move, `apps/web/features/` ceases to exist (becomes `apps/web/frontend/features/`) and `apps/web/lib/` ceases to exist entirely. Tailwind v4's `@source` directive (the proposal pipeline ships with `@tailwindcss/postcss` 4.2.4, see `apps/web/postcss.config.mjs`) is what tells Tailwind which non-`@import` source trees to scan for utility classes. With both paths broken, Tailwind will silently emit a stylesheet missing every utility class used in feature components and the viewer stub — pages render unstyled, and `pnpm build` succeeds without surfacing the regression.
- **Fix:** The Implementer must edit `apps/web/app/globals.css` in the same commit as the move:
  ```diff
  -@source "../features";
  -@source "../lib";
  +@source "../frontend";
  +@source "../backend/viewer";
  ```
  (`../frontend` covers `frontend/features/**` and any future client-rendered code under `frontend/`. The viewer stub does not currently emit Tailwind classes, but adding `../backend/viewer` keeps parity with the old `../lib` source for future-proofing — alternatively, drop the line. Either way, do not just rename `../features` → `../frontend/features` and call it done; the proposal's `frontend/` umbrella is what makes the wider source root the right call.)

### B2. `STRUCTURE.md` and §4 of the proposal claim `apps/web/middleware.ts` exists; it does not

- **Where:** Proposal §2 target tree line `├── middleware.ts                     # UNCHANGED — Next.js requires this path`, proposal §4 row "`apps/web/middleware.ts` — Next.js requires `middleware.ts` at the app root.", `STRUCTURE.md` line 103.
- **Verification:**
  ```
  $ ls apps/web/middleware.ts
  ls: apps/web/middleware.ts: No such file or directory
  ```
- **Rule violated / risk:** Hallucinated path (carried in from `STRUCTURE.md`, which is also wrong). The proposal hand-waves this as "Next requires this exact path; cannot move" — there is nothing to move because nothing exists. The Implementer should not be instructed to preserve a file that does not exist. If the Implementer follows the §4 list verbatim with a `git mv` script, the script will not error (no move targeted), but the post-move sanity check "verify `middleware.ts` still at app root" will spuriously fail.
- **Fix:** Delete the row from §2 and §4 in any future revision (or, if the user actually wants middleware, add it as a new file — but that is a separate task, not part of the reorg). Critic does not amend the proposal; the Implementer must drop the row before running.

### B3. The `@/utils/*` and `@/data/*` "convenience aliases" silently break the boundary table

- **Where:** Proposal §7 — both the target tsconfig diff and the prose. `STRUCTURE.md` boundary table rows for `features/**` and `server/**`.
- **Rule violated / risk:** Today the boundary table reads:
  - `features/**` may import `@/utils/*`, `@/data/*` — fine.
  - `server/**` may import `@/utils/*` — fine; `@/data/*` is *not* in its allow-list.
  Under the proposed alias, `@/utils/*` resolves to `./frontend/utils/*` and `@/data/*` resolves to `./frontend/data/*`. So a `server/**` (now `backend/**`) file using `import { fmt } from "@/utils/format"` would, post-move, be importing across the backend → frontend boundary that the rest of the proposal is trying to clarify. Wave-1's rule "`server/**` may import `@/utils/*`" was explicit because `utils/` was peer-level and toolchain-neutral. Re-anchoring it under `frontend/` makes that import edge a violation of the rule the proposal is supposed to harden.
- **Fix:** Pick one of these (Critic's recommendation: option (a)):
  - **(a) Move `utils/` to a peer of `frontend/` and `backend/`.** Add a third top-level folder `apps/web/shared/` that owns truly framework-free helpers, repoint `@/utils/*` → `./shared/*`. Top-level count goes from 4 → 5 (still well under the original 8). This preserves the existing boundary rule verbatim.
  - **(b) Forbid `backend/**` from importing `@/utils/*` going forward and document the change.** Requires a grep to confirm `backend/**` (today's `server/**`) doesn't already import `@/utils/*`. If it does, the import sites must be rewritten (move the helper, or duplicate).
  - **(c) Split: `frontend/utils/` for client helpers + `backend/utils/` (or in-feature `<feature>.utils.ts`) for server helpers.** Then `@/utils/*` is dropped as a global alias.

  The proposal's current text picks none of the above; it preserves `@/utils/*` as a friendly redirect while covertly relocating the target. That is the kind of silent boundary drift the Critic exists to catch.

---

## 3. Nit-level issues

### N1. `apps/web/scripts/` does not exist on disk; proposal §3.5 already notes this. No code change needed.

- **Where:** Proposal §2 target tree shows `backend/scripts/.gitkeep`; §3.5 acknowledges "currently empty / not-yet-created".
- **Issue:** Adding `backend/scripts/` with only `.gitkeep` creates a single-file folder (tracked only by `.gitkeep`) that the proposal otherwise prohibits in §3.3 ("the brief explicitly discourages [single-file folders]"). Defensible because the `.gitkeep` is structural, not source — but inconsistent.
- **Fix:** Either (a) drop the folder until the first script lands (preferred — empty folders are cheap to create later), or (b) commit the placeholder with a 1-line `README.md` explaining its purpose, mirroring the `backend/cxc-ai/evals/README.md` pattern the proposal uses elsewhere. Don't ship `.gitkeep`.

### N2. `backend/viewer/` is a single-file folder

- **Where:** Proposal §6.2.
- **Issue:** `lib/viewer.ts` becomes `backend/viewer/viewer.ts` plus a barrel — a 2-file folder where one file is the barrel re-exporting the other. Proposal §3.3 explicitly rationalises this ("future auth wiring lands cleanly in `backend/viewer/`"), so it is intentional, but until auth lands it remains the kind of "single-file folder" Wave-1 calls a smell.
- **Fix:** Acceptable as proposed; acknowledge it. If preferred, place the file as `backend/viewer.ts` directly (no folder) and live with a shallower path — the Implementer should pick one and stop the bikeshed at the proposal stage.

### N3. `frontend/index.ts` placeholder serves no consumer

- **Where:** Proposal §6.4 row `apps/web/frontend/index.ts | export {};`.
- **Issue:** No code path imports `@/frontend` (per-feature barrels are the documented entry point). Wave-1 mandates barrels at *boundaries* — `frontend/` is a folder umbrella, not an import surface. An `export {}` barrel is dead code.
- **Fix:** Drop the file. Re-add only if/when a real consumer appears.

### N4. `frontend/data/index.ts` is "new — `data/` had no barrel"

- **Where:** Proposal §6.4.
- **Issue:** The current `apps/web/data/` already has no `index.ts`, and consumers `import { TOPIC_LIST } from "@/data/topics.data"` directly. Adding a barrel post-reorg quietly changes the canonical import shape without any consumer being rewritten. If the Implementer adds `frontend/data/index.ts` as `export * from "./topics.data";`, the new shape `import { TOPIC_LIST } from "@/data"` becomes legal, and over time the import sites diverge.
- **Fix:** Either (a) skip the barrel (preserve current "deep import is the norm here") or (b) add the barrel *and* run a codemod in the same commit to rewrite every `@/data/topics.data` to `@/data`. Don't ship the barrel half-done.

### N5. Stale `STRUCTURE.md` `tags/` → `tags.types.ts` references and missing `answers.queries.ts`

- **Where:** Proposal §6.1 mentions `apps/web/server/tags/tags.service.ts` and `tags/index.ts` only — accurate. But it also lists no `tags.types.ts` and no `tags.queries.ts`, which matches the current disk state. **However**, the proposal's §2 target tree does the same — fine. The nit: `STRUCTURE.md`'s "Where Things Live (cookbook)" section will need a parallel rewrite to drop legacy file lists. Not a proposal defect, but it should be in the doc-update checklist (see §6 of this critique).

### N6. `app/api/` is the HTTP edge of `backend/`, not part of the rename, but the proposal's §9.7 leaves the explanation as a TODO

- **Where:** Proposal §9.7.
- **Issue:** The proposal correctly identifies that `app/api/*` route handlers cannot move and proposes documenting their semantic relationship in `STRUCTURE.md` post-move. Acceptable, but flagging here so the Documenter pass actually does it (otherwise contributors will keep asking "why is `app/api/` not under `backend/`?").
- **Fix:** Add to the doc-update checklist (already done in §6 below).

---

## 4. Hallucination check

| Path in proposal | Exists today? | Verification |
|---|---|---|
| `apps/web/server/http/{http,inputs,contracts,index}.ts` | ✓ | `find apps/web/server/http -type f` |
| `apps/web/server/questions/{questions.service,questions.queries,questions.mutations,questions.mappers,questions.types,index}.ts` | ✓ | `find apps/web/server/questions -type f` |
| `apps/web/server/answers/{answers.service,answers.mutations,answers.types,index}.ts` | ✓ | `find apps/web/server/answers -type f` |
| `apps/web/server/search/{search.service,search.queries,search.types,index}.ts` | ✓ | `find apps/web/server/search -type f` |
| `apps/web/server/tags/{tags.service,index}.ts` | ✓ | `find apps/web/server/tags -type f` |
| `apps/web/server/cxc-ai/agents/{cxc.agent,research-subagent.agent,model-registry,index}.ts` | ✓ | `find apps/web/server/cxc-ai/agents -maxdepth 1 -type f` |
| `apps/web/server/cxc-ai/agents/prompts/{system.prompt,ask-the-community.prompt,index}.ts` | ✓ | `find apps/web/server/cxc-ai/agents/prompts -type f` |
| `apps/web/server/cxc-ai/agents/tools/task.tool.ts` | ✓ | `ls apps/web/server/cxc-ai/agents/tools/` |
| `apps/web/server/cxc-ai/services/{chat.service,retrieval.service,web-context.service,citation-extraction.service,stream-registry,index}.ts` | ✓ | `find apps/web/server/cxc-ai/services -type f` |
| `apps/web/server/cxc-ai/types/{cxc.types,index}.ts` | ✓ | `find apps/web/server/cxc-ai/types -type f` |
| `apps/web/server/{cxc-ai/index,index}.ts` | ✓ | `ls` |
| `apps/web/lib/{viewer,index}.ts` | ✓ | `ls apps/web/lib/` |
| `apps/web/features/shell/components/{page-shell,side-rail,top-command-bar,topic-rail}.tsx` + `index.ts` | ✓ | `find apps/web/features/shell -type f` |
| `apps/web/features/questions/components/{answer-composer,answer-list,markdown,question-detail,question-feed,question-row}.tsx` + `index.ts` | ✓ | `find apps/web/features/questions -type f` |
| `apps/web/features/ask/components/ask-form.tsx` + `index.ts` | ✓ | `find apps/web/features/ask -type f` |
| `apps/web/features/cxc-ai/components/*.tsx` + `hooks/*.ts` + `index.ts` | ✓ | `find apps/web/features/cxc-ai -type f` |
| `apps/web/utils/index.ts` | ✓ | `ls apps/web/utils/` |
| `apps/web/data/topics.data.ts` | ✓ | `ls apps/web/data/` |
| **`apps/web/middleware.ts`** | **✗ HALLUCINATED** | `ls apps/web/middleware.ts` → `No such file or directory`. Proposal §2 + §4 both treat it as present. |
| **`apps/web/scripts/`** | **✗ HALLUCINATED** | `ls apps/web/scripts` → `No such file or directory`. Proposal §3.5 acknowledges this; §2 still draws the folder in the target tree as the move destination. The Implementer must *create*, not move. |

Two hallucinations. Both flagged in §2/§3 above; they are inherited from `STRUCTURE.md`, which is itself stale on these two paths.

---

## 5. String-path / dynamic-import audit

| Location | What it references | Move-time impact | Implementer action |
|---|---|---|---|
| `apps/web/app/globals.css:3` | `@source "../features"` | Resolves to `apps/web/features/` post-move → broken. | Rewrite to `@source "../frontend"` (covers the new `frontend/features/` and any future client trees). See B1. |
| `apps/web/app/globals.css:4` | `@source "../lib"` | Resolves to `apps/web/lib/` post-move → broken. | Drop, or rewrite to `@source "../backend/viewer"`. See B1. |
| `apps/web/app/globals.css:5` | `@source "../../../packages/ui/src"` | Unchanged (packages/ not moved). | None. |
| `apps/web/next.config.ts:5` | `const root = join(dirname(fileURLToPath(import.meta.url)), "../..")` | Resolves the Turbopack root to the repo root via `../..` from `apps/web/next.config.ts`. Unchanged because `next.config.ts` doesn't move. | None. |
| `packages/db/prisma.config.ts` | repo-relative paths to `prisma/` sibling | All inside `packages/db/`, untouched. | None. |
| `eslint.config.mjs` | `**/.next/**`, `**/.turbo/**`, `**/dist/**`, `**/node_modules/**`, `next-env.d.ts` ignores. | Glob-based; no folder names matched by reorg. | None. |
| `turbo.json` | `outputs: [".next/**", "!.next/cache/**", "dist/**"]`. | Glob-based, no folder names matched. | None. |
| `apps/web/tsconfig.json` `include` | `next-env.d.ts`, `**/*.ts`, `**/*.tsx`, `.next/types/**/*.ts`, `.next/dev/types/**/*.ts`. | Already glob-based. | None — but the `paths` block is the actual rewrite (proposal §7). |
| `Dockerfile` | `COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./`, then per-package `COPY <pkg>/package.json …`, then `COPY . .`. | No reference to `apps/web/server`, `lib`, `features`, etc. | None. |
| `docker-compose.yml` | service definitions only; no bind mounts of `apps/web` subpaths. | No impact. | None. |
| Source-side dynamic `import()` / `require()` | `grep -rn "import(" apps/web --exclude-dir=.next` returns zero source matches (only `.next/types/validator.ts` autogenerated noise, which is safe to nuke with `rm -rf apps/web/.next`). | No impact, but the Implementer should re-grep on a clean checkout. | None beyond §8 of proposal. |
| `packages/ui/src/index.ts:5` | comment string `"@/server/*"` in JSDoc warning. | Stale documentation reference, not an import. | Update string to `"@/backend/*"` after the move. |
| `apps/web/.next/dev/types/validator.ts` (et al.) | autogenerated `import("../../../app/...")` paths | All paths inside `app/`, which doesn't move. Cache must be wiped (`rm -rf apps/web/.next`) before `pnpm typecheck`, as the proposal already notes in §8. | Already covered. |

**Summary:** the proposal's risk table (§8) covers `next.config.ts`, `prisma.config.ts`, `eslint.config.mjs`, `Dockerfile`, `docker-compose.yml`, `.next/types`, and dynamic imports. **It misses Tailwind `@source` directives, which are the single hardest break in this reorg.** Add `globals.css` to the risk table and the move checklist. (See B1.)

---

## 6. Doc-update checklist

The proposal's §9.2 punts doc updates to a follow-up commit. That is acceptable, but the Implementer must hand the Documenter a list. Below is the exhaustive list of doc files and the line-number-anchored snippets that reference paths the reorg invalidates. Numbers are based on the current files on disk.

| File | Lines / sections | What changes |
|---|---|---|
| `STRUCTURE.md` | L86–L102 (apps/web tree), L107–L120 (path alias table), L148 (packages/ui prose), L185 (Barrels rule), L193–L197 (Boundary Rules table), L201–L210 (cookbook adding-a-feature), L218–L220 (cookbook adding-a-CXC-AI-tool), L229–L245 (Equivalence Map), L103 (`middleware.ts` row — fix hallucination too) | Full rewrite of any cell mentioning `server/`, `features/`, `lib/`, `utils/`, `data/`, `scripts/`, or `@/server/*`/`@/lib/*`. Drop `middleware.ts` row unless we actually create it. |
| `CLAUDE.md` | L62 (`apps/web/features` …), L64–L69 (`apps/web/server` pipeline list), L70 (`apps/web/lib` row) | Rename to `apps/web/backend`, `apps/web/frontend/features`. Update viewer location to `apps/web/backend/viewer`. |
| `README.md` | L155 (`apps/web/features`), L205 (full architecture paragraph mentioning `apps/web/features`, `apps/web/server`) | Rename references. |
| `docs/architecture.md` | L41 (`apps/web/server` ASCII pipe), L49 (`apps/web/server` ASCII pipe), L63 (`apps/web/features` paragraph), L64 (`apps/web/server` paragraph), L69 (`apps/web/lib` paragraph), L75 (`apps/web/server` Prisma boundary paragraph), L113 (`apps/web/server` may compose use cases), L266 (`apps/web/app/api` and `apps/web/server`) | Rename across all eight references. |
| `docs/build/01-organization.md` | L70 ("server/" tree node, L78–L99 of the tree), L106 (`lib/` tree node), L110 (`utils/`), L114 (`data/`), L117 (`scripts/`), L178–L181 (Shared Types Policy), L189–L201 (path aliases JSON example), L207–L210 (Boundary Rules) | Wave-1 brief is the contract Critic enforces; **must** be updated synchronously with the move so future Critics keep referencing reality. |
| `docs/build/02-backend.md` | L3, L43 (`apps/web/server` references) | Rename to `apps/web/backend`. |
| `docs/build/03-frontend.md` | L3 (`apps/web/features`), L101 (`@/server/<feature>.service`), L105–L106 (`@/server/http/inputs`, `@/server/<feature>.service`), L110 (`@/server/http/contracts`) | Rename `@/server/*` → `@/backend/*`; `apps/web/features` → `apps/web/frontend/features`. |
| `docs/build/04-design.md` | L178 (`apps/web/features/<feature>/components`) | Rename. |
| `docs/build/00-orchestration.md` | L37 (`apps/web/server`), L41 (`apps/web/features`) | Rename. |
| `docs/build/tasks/SHARED-CONTEXT.md` | L37, L46, L51 | Rename. |
| `docs/build/tasks/01-questions-page.md` | L19 | Rename. |
| `docs/build/tasks/02-ask-page.md` | L18, L44 (`@/server/http/contracts`) | Rename. |
| `docs/build/tasks/03-question-detail.md` | L18, L48 (`@/server/questions`) | Rename. |
| `docs/build/tasks/04-cxc-ai.md` | L20, L26, L28, L29, L73 | Rename. |
| `docs/build/tasks/notes/*.md` (all five completion notes) | every `apps/web/features/...` and `apps/web/server/...` mention | These are historical artifacts. Recommended: leave as-is and add a header note ("paths reflect pre-Wave-6 layout"). Rewriting the historical notes risks rewriting decisions. |
| `docs/build/tasks/notes/03-detail-shared-needs.md` | L45 (`apps/web/data/topics.data.ts`) | Rename. |
| `docs/build/tasks/notes/01-questions-shared-needs.md` | L19 | Rename. |
| `packages/ui/src/index.ts` | L5 (JSDoc string `"@/server/*"`) | Rename to `"@/backend/*"`. |
| `apps/web/app/globals.css` | L3–L4 | Rewrite `@source` directives. **This is a code change, not a doc change — see B1. Listed here so the Documenter doesn't think it owns this file.** |

The proposal's §8 risk row "External documentation … High — guaranteed" is correct but soft. The above is the literal checklist.

---

## 7. Final tree after fixes

The tree below incorporates: B1 (Tailwind `@source` rewrite — non-tree change, noted at the top), B2 (drop `middleware.ts` row until the file exists), B3 option (a) (`shared/` peer for framework-free helpers), N1 (drop `backend/scripts/.gitkeep` until first script lands), N3 (drop `frontend/index.ts` placeholder), N4 (drop the new `frontend/data/index.ts` barrel until codemod converges).

```
cardinalXchange/
├── apps/
│   └── web/
│       ├── app/                             # UNCHANGED — Next.js requires this path
│       │   ├── (forum)/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   ├── ask/{page,loading,error}.tsx
│       │   │   ├── questions/
│       │   │   │   ├── {page,loading,error}.tsx
│       │   │   │   ├── ask/page.tsx
│       │   │   │   └── [questionId]/{page,loading,error}.tsx
│       │   │   └── tags/{page,loading}.tsx
│       │   ├── cxc-ai/
│       │   │   ├── {layout,page,loading,error}.tsx
│       │   │   └── [chatId]/page.tsx
│       │   ├── api/                         # HTTP edge of backend/
│       │   │   ├── questions/route.ts
│       │   │   ├── questions/[questionId]/route.ts
│       │   │   ├── questions/[questionId]/answers/route.ts
│       │   │   ├── search/route.ts
│       │   │   ├── cxc-ai/route.ts
│       │   │   ├── cxc-ai/chats/[chatId]/route.ts
│       │   │   ├── cxc-ai/chats/[chatId]/messages/route.ts
│       │   │   └── cxc-ai/chats/[chatId]/stream/route.ts
│       │   ├── layout.tsx
│       │   ├── globals.css                  # @source directives REWRITTEN (see B1)
│       │   └── fonts.ts
│       │
│       ├── backend/                         # was: server/
│       │   ├── http/
│       │   │   ├── http.ts
│       │   │   ├── inputs.ts
│       │   │   ├── contracts.ts
│       │   │   └── index.ts
│       │   ├── questions/
│       │   │   ├── questions.service.ts
│       │   │   ├── questions.queries.ts
│       │   │   ├── questions.mutations.ts
│       │   │   ├── questions.mappers.ts
│       │   │   ├── questions.types.ts
│       │   │   └── index.ts
│       │   ├── answers/
│       │   │   ├── answers.service.ts
│       │   │   ├── answers.mutations.ts
│       │   │   ├── answers.types.ts
│       │   │   └── index.ts
│       │   ├── search/
│       │   │   ├── search.service.ts
│       │   │   ├── search.queries.ts
│       │   │   ├── search.types.ts
│       │   │   └── index.ts
│       │   ├── tags/
│       │   │   ├── tags.service.ts
│       │   │   └── index.ts
│       │   ├── cxc-ai/
│       │   │   ├── agents/
│       │   │   │   ├── cxc.agent.ts
│       │   │   │   ├── research-subagent.agent.ts
│       │   │   │   ├── model-registry.ts
│       │   │   │   ├── prompts/{system.prompt,ask-the-community.prompt,index}.ts
│       │   │   │   ├── tools/task.tool.ts
│       │   │   │   └── index.ts
│       │   │   ├── services/
│       │   │   │   ├── chat.service.ts
│       │   │   │   ├── retrieval.service.ts
│       │   │   │   ├── web-context.service.ts
│       │   │   │   ├── citation-extraction.service.ts
│       │   │   │   ├── stream-registry.ts
│       │   │   │   └── index.ts
│       │   │   ├── types/{cxc.types,index}.ts
│       │   │   ├── evals/                   # NEW empty (README.md only) — first eval suite lands here
│       │   │   │   └── README.md
│       │   │   └── index.ts
│       │   ├── viewer/                      # was: lib/
│       │   │   ├── viewer.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       │
│       ├── frontend/                        # NEW umbrella for client-side feature modules
│       │   └── features/                    # was: features/
│       │       ├── shell/{components/*,index.ts}
│       │       ├── questions/{components/*,index.ts}
│       │       ├── ask/{components/*,index.ts}
│       │       └── cxc-ai/{components/*,hooks/*,index.ts}
│       │
│       ├── shared/                          # NEW peer — framework-free helpers + static data
│       │   ├── utils/                       # was: utils/
│       │   │   └── index.ts
│       │   └── data/                        # was: data/
│       │       └── topics.data.ts
│       │
│       ├── public/                          # UNCHANGED — Next requires this path
│       ├── next.config.ts                   # UNCHANGED
│       ├── next-env.d.ts                    # UNCHANGED
│       ├── postcss.config.mjs               # UNCHANGED
│       ├── package.json                     # UNCHANGED
│       └── tsconfig.json                    # paths block updated (see below)
│
├── packages/                                # UNCHANGED (per-package layout untouched)
│   ├── db/    {prisma/, prisma.config.ts, src/, package.json, tsconfig.json}
│   ├── ui/    {src/{tokens,primitives,utils,index.ts}}
│   └── config/{tsconfig/{base.json,next.json,package.json}}
│
├── docs/  {architecture.md, build/{00..04, README.md, tasks/, proposals/}}
├── CLAUDE.md
├── README.md
├── STRUCTURE.md                             # rewritten by Documenter post-move (see §6)
├── docker-compose.yml
├── Dockerfile
├── eslint.config.mjs
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

### Path-alias block for `apps/web/tsconfig.json` (after fixes)

```jsonc
{
  "extends": "@cardinalxchange/config/tsconfig/next.json",
  "compilerOptions": {
    "paths": {
      "@/*":          ["./*"],
      "@/app/*":      ["./app/*"],
      "@/backend/*":  ["./backend/*"],
      "@/frontend/*": ["./frontend/*"],
      "@/features/*": ["./frontend/features/*"],
      "@/utils/*":    ["./shared/utils/*"],
      "@/data/*":     ["./shared/data/*"]
    }
  }
}
```

`@/lib/*` is removed (its only consumer rewrites to `@/backend/viewer`). `@/server/*` is removed (codemod `@/server/` → `@/backend/`). `@/utils/*` and `@/data/*` now resolve under `shared/`, restoring the boundary rule "`backend/**` may import `@/utils/*`" without crossing the frontend tree.

### `apps/web/app/globals.css` (after fixes)

```css
@import "tailwindcss";

@source "../frontend";
@source "../../../packages/ui/src";
```

(The `../lib` line is dropped because the viewer stub does not emit Tailwind classes; if future code under `backend/` ever does, add `@source "../backend"` then. Don't pre-add.)

---

End of critique.
