# Audit A1 — Database Type De-duplication

## The principle

**Every type that mirrors a database table shape must derive from Prisma's generated types, not be hand-written.** The user's exact direction: "There should be no database duplicate types. Any types related to a database table must be created using [the schema generator], not by manual typing."

We use **Prisma** as the schema-of-record. The Prisma client generates `Question`, `Answer`, `Tag`, `User`, etc. types automatically from `packages/db/prisma/schema.prisma`. Anywhere else in the codebase that re-declares those shapes by hand is a bug.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading

1. `packages/db/prisma/schema.prisma` — the schema-of-record.
2. `packages/db/src/db.types.ts` — what's currently re-exported from Prisma (`QuestionRecord`, `AnswerRecord`, `AiChatSessionRecord`, etc.). These ARE derived types — verify the pattern.
3. `apps/web/backend/http/contracts.ts` — wire DTOs sent to the client. The most likely site of hand-typed duplication.
4. `apps/web/backend/**/*.types.ts` — feature-specific types.
5. `apps/web/backend/**/*.service.ts` mappers — they should accept Prisma types in, emit DTOs out.
6. `STRUCTURE.md` — the equivalence map and naming conventions.

## What to find and fix

### Find

For every TypeScript type whose fields mirror a Prisma model (or an `_include` of one), check:

1. **Is the type hand-written when it could derive from Prisma?**
   - `type QuestionRecord = { id: string; title: string; body: string; ... }` is a duplicate of `Prisma.QuestionGetPayload<{}>`.
   - Hand-typing fields like `id: string; createdAt: Date; updatedAt: Date` is suspicious — Prisma already exports them.

2. **Is a wire DTO re-typing fields that come straight from a column?**
   - Wire types CAN diverge from Prisma types (different field names, computed fields, etc.) — those are legitimate.
   - But a DTO that's "Prisma type minus password / minus internal fields" should be `Omit<User, "password" | "internalNotes">`, not hand-rewritten.

3. **Are derived types (Pick/Omit/Partial) used where they could be?**
   - If a UI type is "the question list row needs id, title, slug, excerpt" — that's `Pick<Question, "id" | "title" | "slug"> & { excerpt: string }`, not a fresh `type`.

### Search commands

```bash
# Find every type alias that looks like a DB shape
rg -n '^(export )?(type|interface) \w+(Record|Dto|Row|Entity)\b' apps/web packages

# Find every place fields like createdAt: Date / updatedAt: Date are declared
rg -n 'createdAt:\s*(Date|string)' apps/web packages

# Find every hand-typed `id: string;` in a type alias
rg -n '^\s+id:\s*string;' apps/web packages
```

### Fix

For each hand-typed duplicate:

1. **If it's an internal/server-only type:** replace with a Prisma type import.
   - `import type { Question } from "@cardinalxchange/db";` or use `Prisma.QuestionGetPayload<{ include: { tags: true } }>` for joined shapes.

2. **If it's a wire DTO:** keep the DTO file but derive its shape from Prisma:
   - Bad: `type QuestionRowDto = { id: string; title: string; ... };`
   - Good: `type QuestionRowDto = Pick<QuestionRecord, "id" | "title" | "slug"> & { excerpt: string; tags: TagDto[] };`

3. **Update the mapper** so it accepts a Prisma payload as input and produces the DTO via spread/Pick rather than re-typing every field.

4. **Verify the wire shape didn't change** — if a field type is now `Date` instead of `string`, you'll need to serialize at the boundary. Be careful here: route handlers serialize JSON, so `Date` becomes `string` automatically in transit, but the server-side type is `Date`. Use a `Serialized<T>` helper if needed (recursively rewrite Date → string).

## Hard rules

- **Do not** modify the Prisma schema itself.
- **Do not** change wire shape semantics — same fields, same names, same nullability.
- **Do not** introduce `any` or weaken types.
- **Do not** delete types that have callers — refactor in place.
- Run `pnpm typecheck` after every batch of edits. Fix breakage before continuing.

## Verification

```bash
pnpm typecheck         # green
pnpm lint              # green
pnpm test              # green (114 tests still pass)
pnpm build             # green
```

## Output

Commit your work in logical chunks (`refactor(types): derive QuestionRowDto from Prisma`, etc.).

Write `docs/build/proposals/db-type-dedup.md` with:

- Audit summary: how many hand-typed DB-shaped types found, how many fixed, how many intentionally left (and why)
- Per-fix: file:line, before/after, principle applied
- Final verification status

## Boundaries

You own:

- `apps/web/backend/**`
- `packages/db/src/**` (only the types layer; do not touch queries/mutations logic)
- `apps/web/backend/http/contracts.ts`

Stay out of:

- `apps/web/frontend/**` (covered by audit A3)
- `apps/web/app/**` (covered by audit A3 for components, A2 for derived types)
- `packages/ui/**`
- Tests in `__tests__/` (don't break them, but don't refactor them either)

## Report back

≤200 words. Counts (found/fixed/skipped), most consequential change, any blockers.
