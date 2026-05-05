# Audit A2 — Derived Types Across the Stack

## The principle

The user's exact direction: "If the database table is slightly modified to include new fields, or it is structured so it is easier to define the type as a modification of the underlying database type that has its own fully fleshed-out type."

In short: **types that are derivations of DB types should be expressed as derivations** (`Pick<T, ...>`, `Omit<T, ...>`, `T & { extras }`, `Prisma.QuestionGetPayload<{ include: ... }>`), not as fresh hand-written interfaces. When the schema changes, the derivation auto-tracks. When it's hand-typed, the codebase silently drifts.

This audit goes one layer up from A1: A1 finds duplicate DB types, A2 finds **types that should be derivations** of DB types but are written from scratch.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading (in this order)

1. `packages/db/prisma/schema.prisma` — the schema-of-record.
2. `packages/db/src/db.types.ts` — current Prisma re-exports + include shapes.
3. `apps/web/backend/http/contracts.ts` — wire DTOs.
4. `apps/web/frontend/features/**/types/*.types.ts` — frontend feature-local types.
5. `apps/web/backend/**/*.types.ts` — backend feature-local types.
6. The Prisma docs page on `Prisma.<Model>GetPayload<...>`: https://www.prisma.io/docs/orm/prisma-client/type-safety/operating-against-partial-structures-of-model-types

## What to find and fix

### Pattern 1 — Frontend "view" types that re-declare a subset

Bad:

```ts
// QuestionRowView is the question row in the feed
export type QuestionRowView = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: { slug: string; label: string }[];
  answers: number;
  author: string;
  askedAt: string;
};
```

Good:

```ts
import type { QuestionRowDto } from "@/backend/http/contracts";

// View is just the wire DTO. If we ever add UI-specific computed fields,
// extend with `& { computed: ... }`.
export type QuestionRowView = QuestionRowDto;
```

### Pattern 2 — DTOs that re-declare every field

Bad:

```ts
export type QuestionDetailDto = {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: QuestionStatus;
  createdAt: string;
  ...
};
```

Good:

```ts
import type { QuestionRecord } from "@cardinalxchange/db";
import type { Serialized } from "@/backend/http/contracts";

export type QuestionDetailDto = Serialized<
  Omit<QuestionRecord, "internalNotes"> & {
    answersList: AnswerDto[];
    tags: QuestionTagDto[];
  }
>;
```

(`Serialized<T>` should rewrite `Date → string` recursively. If it doesn't exist, add it once in `apps/web/backend/http/contracts.ts`.)

### Pattern 3 — Mapper signatures that accept fresh objects

Bad:

```ts
export function toQuestionRowDto(args: {
  id: string;
  slug: string;
  title: string;
  ...
}): QuestionRowDto { ... }
```

Good:

```ts
import type { Prisma } from "@cardinalxchange/db";

type Source = Prisma.QuestionGetPayload<{ include: typeof questionFeedInclude }>;

export function toQuestionRowDto(source: Source): QuestionRowDto { ... }
```

### Pattern 4 — Frontend props that re-declare a DTO

Bad:

```ts
type Props = {
  question: { id: string; title: string; slug: string; ... };
};
```

Good:

```ts
import type { QuestionRowDto } from "@/backend/http/contracts";

type Props = { question: QuestionRowDto };
```

## Search commands

```bash
# Type aliases with a `tags: { ... }[]` substructure (likely a duplicate of a DTO)
rg -n 'tags:\s*\{[^}]+\}\[\]' apps/web

# Type aliases that look like a flattened question/answer/user shape
rg -n '^(export )?(type|interface) (Question|Answer|User|Tag|Session)' apps/web --type ts

# Inline type literals in component props that mirror a DTO
rg -n '\{ id: string; slug: string;' apps/web --type ts
```

## Hard rules

- **Do not** weaken types or introduce `any` / `unknown`.
- **Do not** change wire shape — same JSON output before and after.
- **Do not** delete types with external callers — refactor in place.
- **Do not** add new dependencies. `Pick`, `Omit`, `Partial`, `Required`, `Prisma.<Model>GetPayload<...>` are sufficient.
- Run `pnpm typecheck` after every batch.

## Verification

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

All green. Tests count should remain ~114.

## Output

Commit in logical chunks. Write `docs/build/proposals/derived-types.md` with:

- Audit summary: how many types refactored to derivations
- A "before/after" sample for the most representative case in each layer (db, backend, frontend)
- Anything intentionally left as hand-typed (and why — e.g., truly schema-independent shapes)

## Boundaries

You own:

- `apps/web/backend/http/contracts.ts` (the most important file for this audit)
- `apps/web/backend/**/*.types.ts`
- `apps/web/frontend/features/**/types/**` and any `*.types.ts` therein
- Mapper signatures inside `apps/web/backend/**/*.service.ts` (only the type signatures, not the logic)

Stay out of:

- `packages/ui/**`
- `apps/web/app/globals.css`
- DB schema (`packages/db/prisma/schema.prisma`)
- Tests (don't refactor them; if they break because of your derivations, fix them in place)

If audit A1 (DB type de-dup) is also running and you collide on a file, audit A1 takes priority on backend internal types; audit A2 takes priority on cross-layer derivations.

## Report back

≤200 words. Counts (refactored/skipped), one before/after example, blockers.
