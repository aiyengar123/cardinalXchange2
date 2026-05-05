# Audit A1 — DB Type De-duplication (Build 2)

## Principle

Every type that mirrors a database table shape derives from Prisma's generated types — never hand-written. Prisma's `schema.prisma` is the schema-of-record. Anywhere else in the codebase that re-declares those shapes by hand is a bug.

## Scope

`apps/web/backend/**` and `packages/db/src/**` (types layer only). Frontend, route components, `app/**` derived types, and `packages/ui/**` are out of scope (covered by sibling audits A2/A3/A4).

## Audit Summary

| Category                                  | Count |
| ----------------------------------------- | ----- |
| Hand-typed DB-shaped types found in scope | 4     |
| Fixed (now derive from Prisma)            | 4     |
| Intentionally left                        | 4     |
| Already derived (no change needed)        | 3     |

### Already derived (verified, no change)

These are model-shape exports that already use `Prisma.*GetPayload<...>` — the pattern this audit endorses:

- `packages/db/src/db.types.ts:26` — `QuestionRecord` = `Prisma.QuestionGetPayload<{ include: typeof questionInclude }>`
- `packages/db/src/db.types.ts:60` — `QuestionFeedRecord` = `Prisma.QuestionGetPayload<{ include: typeof questionFeedInclude }>`
- `packages/db/src/db.types.ts:72` — `AiChatSessionRecord` = `Prisma.AiChatSessionGetPayload<{ include: typeof aiChatSessionInclude }>`

### Fixed

#### 1. `packages/db/src/tags.queries.ts:3` — `TagWithCountRecord`

**Before:**

```ts
export type TagWithCountRecord = {
  slug: string;
  label: string;
  questionCount: number;
};
```

**After:**

```ts
import type { Tag } from "@prisma/client";

export type TagWithCountRecord = Pick<Tag, "slug" | "label"> & {
  questionCount: number;
};
```

**Principle applied:** column-rooted fields (`slug`, `label`) come straight from `Tag`; `questionCount` is a derived aggregate kept on the side via intersection.

---

#### 2. `packages/db/src/users.queries.ts:3` — `UserProfileRecord`

**Before:**

```ts
export type UserProfileRecord = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  questionCount: number;
  answerCount: number;
};
```

**After:**

```ts
import type { Answer, Question, User } from "@prisma/client";

export type UserProfileRecord = Pick<
  User,
  "id" | "name" | "displayName" | "email" | "image" | "createdAt"
> & {
  questionCount: number;
  answerCount: number;
};
```

**Principle applied:** the user columns now come from the Prisma-generated `User` type, so a schema rename or nullability change propagates automatically. Counts stay as ad-hoc aggregates.

---

#### 3. `packages/db/src/users.queries.ts:44` — `UserActivityRecord`

**Before:**

```ts
export type UserActivityRecord = {
  questions: Array<{
    id: string;
    slug: string;
    title: string;
    createdAt: Date;
    answerCount: number;
  }>;
  answers: Array<{
    id: string;
    questionId: string;
    questionSlug: string;
    questionTitle: string;
    body: string;
    createdAt: Date;
  }>;
};
```

**After:**

```ts
export type UserActivityRecord = {
  questions: Array<
    Pick<Question, "id" | "slug" | "title" | "createdAt"> & {
      answerCount: number;
    }
  >;
  answers: Array<
    Pick<Answer, "id" | "questionId" | "body" | "createdAt"> & {
      questionSlug: string;
      questionTitle: string;
    }
  >;
};
```

**Principle applied:** every column-rooted field comes from `Question` / `Answer`. Only joined-in synthetic fields (`questionSlug`, `questionTitle`, `answerCount`) are written by hand, which is correct — they don't exist on a single row.

---

#### 4. `apps/web/backend/users/users.service.ts:12` — `UserProfileDto`

**Before:** 25-line hand-typed wire DTO that re-declared `id`, `name`, `email`, `image`, plus full nested question/answer shapes that re-listed columns already on `Question` / `Answer`.

**After:** (final form, after sibling audit A2 added the `Serialized<T>` boundary helper)

```ts
import type { Serialized } from "@/backend/http/contracts";

export type UserProfileDto = Serialized<
  Pick<
    UserProfileRecord,
    "id" | "name" | "email" | "image" | "questionCount" | "answerCount"
  > &
    UserActivityRecord & {
      displayName: string;
      joinedAt: Date;
    }
>;
```

**Principle applied:** the DTO inherits its column inventory transitively through the now-Prisma-derived `UserProfileRecord` / `UserActivityRecord`, then `Serialized<T>` recursively rewrites every `Date` field to the `string` the wire actually carries. Wire-only divergences (`displayName` collapsed to non-null after fallback, `createdAt → joinedAt` rename) are spelled out explicitly. Adding a column to `User`/`Question`/`Answer` flows through to the wire automatically; suppressing one requires a deliberate `Omit`/`Pick`.

The chunk first landed in `28c0cd9` using a manual `Omit<…, "createdAt"> & { createdAt: string }` pattern; sibling audit A2 (`5ecb0f9`) replaced the manual rewrite with `Serialized<T>` once that helper landed. Both forms are semantically equivalent — `Serialized<T>` is preferred for consistency with other DTOs.

### Intentionally left (and why)

#### `apps/web/backend/http/contracts.ts:18` — `QuestionSummaryDto`

Wire DTO with multiple computed/renamed fields (`excerpt` from `body`, `askedAt` and `activity` as relative-time strings, `status` lowercased and collapsed `ACCEPTED → answered`, `author` from `authorName`, `tags` projected to `QuestionTagDto`). Fields do not map 1:1 to `Question` columns. The brief explicitly permits this.

#### `apps/web/backend/http/contracts.ts:39` — `AnswerDto`

Renames `authorName → author`, drops `authorId`, projects `authorMeta: string | null → string`, serializes `createdAt: Date → string`. Of seven fields, three are renamed/projected, so a `Pick<Answer, …> & { rename }` form would not be net-shorter than the literal type. Wire-DTO divergence is explicit and documented inline.

#### `apps/web/backend/http/contracts.ts:71` — `AiChatSession`

Wire shape diverges from `AiChatSession` model: `messageCount` is computed from a relation, `title` is collapsed to non-null, `createdAt`/`updatedAt` serialize to ISO strings. Diverges enough to justify a literal type.

#### `packages/db/src/cxc.queries.ts:41` — `InternalContextRow`

Synthesized retrieval row that interleaves projected `Question` and `Answer` data with a synthetic `kind` discriminator and a hand-built URL. Not a row of any single table. Not a duplicate.

#### `packages/db/src/db.types.ts:76,85,92,100,109` — `Create*Input`, `AiChatSourceInput`, `Persisted*Input`

Input shapes for create/persist operations, not row shapes (e.g., `CreateQuestionRecordInput.tags` is `string[]` while `Question.tags` is `QuestionTag[]`). Different domain — these are call-site contracts for the data layer, not mirrors of a column set.

#### `apps/web/backend/viewer/viewer.ts:3` — `Viewer`

Auth identity façade — composes session-derived fields with a literal `source` discriminator and an authentication boolean. Not a `User` row. Not a duplicate.

## Final Verification

Verified after each chunk and again at the end of the audit (against the final tree including sibling A2/A4 commits):

```
pnpm typecheck   ✓ 4 successful
pnpm lint        ✓ 4 successful (eslint . --max-warnings=0)
pnpm test        ✓ 17 (db) + 97 (web) = 114 tests passed
pnpm build       ✓ 4 successful
```

## Commits (audit A1)

1. `1f0514d` — refactor(types): derive packages/db record types from Prisma models
2. `28c0cd9` — refactor(types): derive UserProfileDto from Prisma-backed records
