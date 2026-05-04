# CardinalXchange Build Plan — Build 1

This directory is the build plan for the next push of CardinalXchange. It is split into one markdown per agent so each can be edited, reviewed, and handed off independently.

## Canonical Visual Spec

The four panels in this image are the product. Every UI decision must trace back to it. When in doubt, agents must re-open the image and resolve ambiguity from it, not from imagination.

`file:///Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

The four panels (left→right, top→bottom):

1. **Questions list** — top command bar, left rail (CXC AI / Questions / Topics / Trending), centered question feed with title, snippet, tags, meta.
2. **Ask a Question** — same shell, centered form (Title, Body, Tags, Submit).
3. **Question detail** — title, full body, **multiple answers stacked** (this is the only intentional deviation from the image: the image shows one answer; build supports a list of answers), then an answer composer.
4. **CXC AI** — full-page chat at `/cxc-ai`, message list + composer, source-labeled responses.

## Pipeline

```
[01-organization]   structure proposer  →  structure critic  →  structure implementer
        ↓
[02-backend]        backend agent (routes, db, server, services)
[03-frontend]       frontend agent (4-panel breakdown, routes, components)
        ↓
[04-design]         design-system agent (tokens, typography, primitives)
```

Organization runs first. Backend and frontend run in parallel against the agreed structure. Design system is shared and finalized before frontend implementation lands.

## Files

- [00-orchestration.md](./00-orchestration.md) — agent pipeline, hand-off protocol, image-as-source-of-truth rule.
- [01-organization.md](./01-organization.md) — folder/file structure, naming, indexes, shared types. Proposer/critic/implementer contracts.
- [02-backend.md](./02-backend.md) — db, routes, server modules, services, AI agents (prompts/services/types).
- [03-frontend.md](./03-frontend.md) — panel-by-panel breakdown, routes, components, state.
- [04-design.md](./04-design.md) — design philosophy, tokens, typography, component library, square-corner rule.

## Hard Constraints (inherit from `CLAUDE.md` and `docs/architecture.md`)

- No auth, no courses, no votes, no reputation, no notifications, no admin.
- No seeded fixtures — every page must look correct on an empty database.
- `packages/ui` stays client-safe (no server, db, ai, or auth imports).
- AI keys are server-only; CXC AI is full-page only at `/cxc-ai` and `/cxc-ai/[chatId]`.
- DB models keep generic names (`AiChatSession`, `AiChatMessage`, `AiChatSource`); UI label is `CXC AI`.
- Square corners by default; rounded only on top-of-page titles or where the image clearly shows a pill.
