# 00 · Orchestration

How the build agents are sequenced, what each one is responsible for, and how they hand off.

## Image Is The Source Of Truth

`file:///Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

Every agent must re-open the image at the start of its task and at any point it has to make a visual judgment. If the image and a doc disagree, the image wins for layout/visual decisions and the doc must be updated. The single intentional override: **panel 3 supports multiple answers**.

## Agents

### A. Structure Proposer (`01-organization.md`)

Reads `CLAUDE.md`, `docs/architecture.md`, and the current `apps/web` and `packages/*` trees. Outputs a single proposal: the full target folder/file tree with one-line rationale per top-level node. Does **not** modify code.

Output goes to `docs/build/proposals/structure-proposal.md`.

### B. Structure Critic

Reads the proposal. Produces a critique that flags:

- Folders that duplicate responsibility (e.g., `lib/` vs `utils/` vs `helpers/`).
- Naming inconsistencies (`*.service.ts` vs `*Service.ts`).
- Cross-boundary imports that would violate `packages/ui` client-safe rule or pull server code into shared packages.
- Missing `index.ts` barrels at folder boundaries.
- Over-folderization (folders with one file).

Output goes to `docs/build/proposals/structure-critique.md`. Does **not** modify code.

### C. Structure Implementer

Reads proposal + critique. Reconciles them into a final tree, writes the empty folder skeleton (with `index.ts` placeholders), and moves existing files to their new homes via `git mv` to preserve history. Updates the path alias section of `tsconfig.json` if needed.

### D. Backend Agent (`02-backend.md`)

Owns `packages/db` and `apps/web/server`. Implements Prisma models, migrations, route handlers, server services, and AI orchestration (prompts, retrieval, persistence). Stops at the route handler boundary; does not touch React components.

### E. Frontend Agent (`03-frontend.md`)

Owns `apps/web/app` route tree and `apps/web/features`. Implements the four panels exactly as in the image, with panel 3 supporting multiple answers. Consumes the design tokens from `04-design.md`. Calls backend through route handlers / server actions only.

### F. Design-System Agent (`04-design.md`)

Owns `packages/ui` and `apps/web/app/globals.css`. Defines tokens, typography, primitives, and the square-corner rule. Publishes a static `designSystem` object that the frontend agent consumes. Runs before the frontend agent finalizes components.

## Hand-Off Protocol

Each agent writes a short **completion note** at the bottom of its own markdown:

```
## Completion Note
- What changed: <bullet list of paths touched>
- Open questions for next agent: <bullet list>
- Image cross-check: <which panels were re-verified>
```

The next agent reads the prior agent's completion note before starting.

## When To Ask

Agents must stop and ask the user (not guess) when:

- The image is ambiguous on a layout decision and the doc does not resolve it.
- A constraint in `CLAUDE.md` would be violated by the simplest implementation.
- A new dependency would be added.

Otherwise, proceed.

## Out Of Scope For Build 1

Auth, profiles, settings, votes, courses, notifications, admin, search ranking beyond title/tag, image upload, and any seed data. These are all explicitly deferred per `docs/architecture.md`.
