# Wave 6 Reorg — Implementation Note

Author: Wave 6 Reorg Implementer
Inputs: `wave-6-proposal.md` + `wave-6-critique.md` (block-level resolutions
binding). Implements the `Final Tree After Fixes` from the critique.

## Block-level resolutions applied

- **B1 (Tailwind `@source`)**: `apps/web/app/globals.css` rewritten — `@source "../features"` and `@source "../lib"` replaced with the single line `@source "../frontend"`. Verified the built CSS bundle (`apps/web/.next/static/chunks/*.css`) still contains all utility classes (`.flex`, `.gap-2`, `.grid`, `.p-6`, `.rounded`, `.bg-cardinal-500`, etc.).
- **B2 (`middleware.ts` hallucination)**: Confirmed `apps/web/middleware.ts` does not exist on disk. No move performed; `STRUCTURE.md` Equivalence Map row updated to "(none yet — Next supports `apps/web/middleware.ts` if needed)".
- **B3 (`@/utils/*` / `@/data/*` boundary drift)**: Resolved via critique option (a). New top-level peer `apps/web/shared/` introduced. `utils/` → `shared/utils/`, `data/` → `shared/data/`. Aliases `@/utils/*` and `@/data/*` repointed to `./shared/utils/*` and `./shared/data/*`. The pre-existing rule "`backend/**` may import `@/utils/*`" no longer crosses the frontend tree.

## Files moved (`git mv`)

| from | to |
|---|---|
| `apps/web/server/http/{contracts,http,inputs,index}.ts` | `apps/web/backend/http/...` |
| `apps/web/server/questions/{questions.{service,queries,mutations,mappers,types},index}.ts` | `apps/web/backend/questions/...` |
| `apps/web/server/answers/{answers.{service,mutations,types},index}.ts` | `apps/web/backend/answers/...` |
| `apps/web/server/search/{search.{service,queries,types},index}.ts` | `apps/web/backend/search/...` |
| `apps/web/server/tags/{tags.service,index}.ts` | `apps/web/backend/tags/...` |
| `apps/web/server/cxc-ai/{index}.ts` | `apps/web/backend/cxc-ai/index.ts` |
| `apps/web/server/cxc-ai/agents/{cxc.agent,research-subagent.agent,model-registry,index}.ts` | `apps/web/backend/cxc-ai/agents/...` |
| `apps/web/server/cxc-ai/agents/prompts/{system.prompt,ask-the-community.prompt,index}.ts` | `apps/web/backend/cxc-ai/agents/prompts/...` |
| `apps/web/server/cxc-ai/agents/tools/task.tool.ts` | `apps/web/backend/cxc-ai/agents/tools/task.tool.ts` |
| `apps/web/server/cxc-ai/services/{chat,retrieval,web-context,citation-extraction}.service.ts`, `stream-registry.ts`, `index.ts` | `apps/web/backend/cxc-ai/services/...` |
| `apps/web/server/cxc-ai/types/{cxc.types,index}.ts` | `apps/web/backend/cxc-ai/types/...` |
| `apps/web/server/index.ts` | `apps/web/backend/index.ts` |
| `apps/web/lib/viewer.ts` | `apps/web/backend/viewer/viewer.ts` |
| `apps/web/lib/index.ts` | `apps/web/backend/viewer/index.ts` |
| `apps/web/features/shell/components/{page-shell,side-rail,top-command-bar,topic-rail}.tsx`, `index.ts` | `apps/web/frontend/features/shell/...` |
| `apps/web/features/questions/components/{answer-composer,answer-list,markdown,question-detail,question-feed,question-row}.tsx`, `index.ts` | `apps/web/frontend/features/questions/...` |
| `apps/web/features/ask/components/ask-form.tsx`, `index.ts` | `apps/web/frontend/features/ask/...` |
| `apps/web/features/cxc-ai/components/{chat-history-rail,chat-shell,citation-bubble,cited-text,markdown,message-list,prompt-input,related-questions,tool-chain}.tsx`, `hooks/{use-cxc-chat,use-stick-to-bottom}.ts`, `index.ts` | `apps/web/frontend/features/cxc-ai/...` |
| `apps/web/utils/index.ts` | `apps/web/shared/utils/index.ts` |
| `apps/web/data/topics.data.ts` | `apps/web/shared/data/topics.data.ts` |

Total: ~70 files moved with `git mv` (history preserved). Stale `.DS_Store`
sentinels under `apps/web/{server,features}/` were removed before pruning the
empty source directories.

Folders eliminated at the web-app top level: `server/`, `features/`, `lib/`,
`utils/`, `data/`. Top-level peers post-move: `app/`, `backend/`, `frontend/`,
`shared/`, `public/`.

## Files modified (non-move)

- `apps/web/app/globals.css` — Tailwind `@source` directives rewritten (B1).
- `apps/web/tsconfig.json` — `paths` block rewritten per critique §7.
- `apps/web/app/(forum)/{ask,questions,tags}/**/page.tsx` — `@/server/*` → `@/backend/*` codemod.
- `apps/web/app/cxc-ai/**/{page,layout}.tsx` — same codemod.
- `apps/web/app/api/**/route.ts` (8 files) — same codemod.
- `apps/web/backend/answers/answers.service.ts` and `apps/web/backend/questions/questions.service.ts` — `@/lib/viewer` → `@/backend/viewer`.
- `apps/web/backend/**/*.ts` (internal cross-imports) — `@/server/*` → `@/backend/*` codemod.
- `apps/web/frontend/features/**/*.{ts,tsx}` — same codemod where present (some shell/feature components imported `@/server/http` DTOs).
- `apps/web/frontend/features/shell/components/side-rail.tsx` — JSDoc path comment updated to `apps/web/shared/data/topics.data.ts`.
- `apps/web/backend/cxc-ai/types/cxc.types.ts` — JSDoc path comment updated to `apps/web/backend/http/contracts.ts`.
- `apps/web/backend/questions/questions.types.ts` — same comment update.
- `packages/ui/src/index.ts` — JSDoc warning string `"@/server/*"` → `"@/backend/*"`.

Barrels: existing `index.ts` files moved unchanged. The `backend/viewer/index.ts` already used a relative import (`./viewer`) so it resolves correctly post-move with no edit. No new barrels were created (per critique N3/N4 — `frontend/index.ts` and `frontend/data/index.ts` placeholders dropped).

## Files created

- `apps/web/backend/cxc-ai/evals/README.md` — 3-line note that the folder is the home for `*.eval.ts` files. Avoids the "single-file folder of just `.gitkeep`" anti-pattern (critique N1) by being a real doc.
- `docs/build/proposals/wave-6-implementation.md` — this file.

No `.gitkeep` files. No `apps/web/backend/scripts/` folder (critique N1 — defer until a real script lands). No `apps/web/frontend/index.ts` (critique N3). No `apps/web/shared/data/index.ts` (critique N4 — preserve direct `@/data/topics.data` import shape).

## Path alias diff

Before (`apps/web/tsconfig.json`):
```jsonc
"paths": {
  "@/*": ["./*"],
  "@/app/*": ["./app/*"],
  "@/features/*": ["./features/*"],
  "@/server/*": ["./server/*"],
  "@/lib/*": ["./lib/*"],
  "@/utils/*": ["./utils/*"],
  "@/data/*": ["./data/*"]
}
```

After:
```jsonc
"paths": {
  "@/*": ["./*"],
  "@/app/*": ["./app/*"],
  "@/backend/*": ["./backend/*"],
  "@/frontend/*": ["./frontend/*"],
  "@/features/*": ["./frontend/features/*"],
  "@/utils/*": ["./shared/utils/*"],
  "@/data/*": ["./shared/data/*"]
}
```

`@/server/*` and `@/lib/*` removed. `@/backend/*` and `@/frontend/*` added. `@/features/*` re-anchored under `frontend/features/*` so legacy import sites work without rewrite. `@/utils/*` and `@/data/*` re-anchored under `shared/` so the boundary rule "`backend/**` may import `@/utils/*`" no longer crosses into `frontend/`.

## Verification

```
$ rm -rf apps/web/.next
$ pnpm install         # exit 0; "Already up to date"
$ pnpm typecheck       # exit 0; 4 tasks successful
$ pnpm lint            # exit 0; 4 tasks successful (--max-warnings=0)
$ pnpm build           # exit 0; full route table (16 routes incl. 8 API routes); no missing-CSS or missing-route warnings
```

Tailwind sanity-check: `apps/web/.next/static/chunks/0y72s8~zikom~.css` is 36636 bytes and contains `.flex`, `.gap-2`, `.grid`, `.p-6`, `.rounded` — the new `@source "../frontend"` directive correctly scans the renamed feature tree.

Visual QA via `~/.claude/skills/gstack/browse/dist/browse`:

- `GET /questions` — 200; PageShell + TopicRail render with cardinal-red accents, ink colors, proper typography. Empty-state skeleton (DB is intentionally empty).
- `GET /ask` — 200; AskForm shell renders with correct field hierarchy.
- `GET /tags` — 200; tag-grid skeleton renders.
- `GET /cxc-ai` — 200; chat-history rail + main chat surface render with proper layout. Existing `AiChatSession` records visible in the rail.

All four pages render with proper Tailwind utility classes — no unstyled output, no FOUC. The `@source "../frontend"` rewrite is producing the same utility-class scan as the pre-reorg `@source "../features" + @source "../lib"` did.

## Doc updates (in this commit)

- `STRUCTURE.md` — full rewrite. New apps/web tree, alias table, boundary table (now including `shared/**` row + `frontend/features/**` rule), cookbook updated for `backend/`, equivalence map drops the `middleware.ts` hallucination and points `evals/` at the now-real `backend/cxc-ai/evals/`.
- `CLAUDE.md` — Architecture section rewritten to describe `backend/`, `frontend/features/`, `shared/`, and the `app/api/` HTTP-edge relationship.
- `README.md` — `apps/web/features` → `apps/web/frontend/features`; backend orchestration paragraph updated to `apps/web/backend` + `apps/web/shared`.
- `docs/architecture.md` — flow diagrams + workspace boundary list + target-structure ASCII tree all updated. Guardrails reference uses `apps/web/backend`.
- `docs/build/00-orchestration.md` — Backend/Frontend Agent ownership lines updated.
- `docs/build/01-organization.md` — full target tree rewritten under `frontend/`/`backend/`/`shared/`. `paths` JSON example, `Shared Types Policy`, `Boundary Rules` (now 5 rows), and `Goals` line all updated.
- `docs/build/02-backend.md` — heading and feature-folder labels updated to `backend/...`. CXC AI tree gains `evals/`.
- `docs/build/03-frontend.md` — feature path + data-flow diagram + DTO import line updated.
- `docs/build/04-design.md` — feature components path updated.
- `docs/build/tasks/SHARED-CONTEXT.md` — three references updated (DTO import, feature path, off-limits backend path).
- `docs/build/tasks/01-questions-page.md`, `02-ask-page.md`, `03-question-detail.md`, `04-cxc-ai.md` — feature paths and `@/server/*` DTO imports updated.
- `docs/build/tasks/notes/01-questions-shared-needs.md`, `03-detail-shared-needs.md` — single-line path-reference fixes per critique. Other notes (`*-completion.md`, `02-ask-shared-needs.md`) are left unchanged per critique recommendation ("rewriting the historical notes risks rewriting decisions").
- `packages/ui/src/index.ts` — JSDoc warning string updated.

## Open issues

None blocking. A few intentional deferrals (all per critique):

- `apps/web/backend/scripts/` not created. Defer until a real dev/ops script lands.
- `apps/web/frontend/index.ts` not created. Defer until a real consumer wants `@/frontend/*` (per-feature barrels are the canonical entry).
- `apps/web/shared/data/index.ts` not created. Preserve the existing `import { ... } from "@/data/topics.data"` shape; introduce a barrel only alongside a codemod that rewrites every consumer in the same commit.
- Historical task-completion notes (`docs/build/tasks/notes/*-completion.md`, `02-ask-shared-needs.md`) reference pre-Wave-6 paths verbatim. Left as-is intentionally; they're snapshots of decisions, not live docs.
