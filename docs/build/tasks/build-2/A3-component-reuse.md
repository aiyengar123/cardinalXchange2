# Audit A3 — Frontend Component Reuse

## The principle

The user's exact direction: "There needs to [be] proper cleanliness on frontend components ... components are reused."

Translation: anywhere two feature folders re-implement the same UI primitive (button, input, badge, card frame, divider, link, etc.), one of two things should happen:

1. The primitive lives in `packages/ui/src/primitives/` and both consumers import it.
2. If it's feature-specific and not yet truly reusable, leave it — but flag it for future lift.

Goal: zero hand-rewritten primitives in feature folders when `packages/ui` already exports the same shape.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading

1. `packages/ui/src/primitives/index.ts` — what's already exported (Button, Badge, Tag, Surface, Input, Textarea, IconButton, Divider, Pill).
2. `packages/ui/src/index.ts` — root barrel.
3. `apps/web/frontend/features/**/components/**/*.tsx` — the surface area.
4. `STRUCTURE.md` "Where Things Live (cookbook)" — the rule for promoting a primitive (3+ features need it before lifting).

## What to find and fix

### Step 1 — Inventory the primitives

For each primitive in `packages/ui/src/primitives/`, search the codebase:

```bash
rg -n '<Button\b' apps/web --type tsx
rg -n '<Badge\b' apps/web --type tsx
rg -n '<Surface\b' apps/web --type tsx
rg -n '<Input\b' apps/web --type tsx
rg -n '<Textarea\b' apps/web --type tsx
# etc.
```

Count usage. Anything used 0 times: probably dead code, flag for deletion.

### Step 2 — Find duplicated primitives

Search for inline patterns that look like a hand-rolled primitive:

```bash
# Inline buttons that look like a copy of <Button variant="primary">
rg -n 'className=".*bg-\[var\(--color-cardinal-500\)\].*text-white' apps/web/frontend --type tsx

# Inline inputs that look like a copy of <Input>
rg -n 'className=".*rounded-(md|lg).*border.*focus:ring' apps/web/frontend --type tsx

# Inline badges
rg -n 'className=".*rounded-(sm|md).*border.*bg-\[var\(--color-ink-50\)\]' apps/web/frontend --type tsx

# Inline cards
rg -n 'className=".*rounded-lg.*border.*bg-\[var\(--color-surface-base\)\].*p-' apps/web/frontend --type tsx
```

For each match, decide:

- **Replace with primitive?** If the inline element matches one of `packages/ui`'s primitives variant-for-variant, replace it.
- **Promote to primitive?** If the same shape appears 3+ times across feature folders and isn't already a primitive, lift it into `packages/ui`.
- **Leave it?** If the inline element is a one-off with feature-specific styling, leave it but note it in your report.

### Step 3 — Verify the primitives' API matches usage

For each primitive in `packages/ui`, look at how it's used:

- Does the prop API match what feature components actually need?
- Are there variants the features need that the primitive doesn't expose?
- Are there variants the primitive exposes that nothing uses?

If a feature is doing `<Button className="...lots of overrides">`, that's a sign the primitive doesn't cover the use case. Either extend the primitive's variants or accept that the override is legitimate. Flag in the report.

### Step 4 — Fix

For each "replace with primitive" case:

1. Replace the inline JSX with the primitive.
2. Verify the rendered output is identical (visual QA via `/browse` if uncertain).
3. Remove any now-unused imports.

For each "promote to primitive" case:

1. Add the new primitive to `packages/ui/src/primitives/<name>.tsx`.
2. Re-export from `packages/ui/src/primitives/index.ts` and `packages/ui/src/index.ts`.
3. Replace all inline copies with the new primitive.

## Hard rules

- **`packages/ui` is client-safe.** Never import server, db, ai, or auth code into a primitive.
- **No new dependencies.** Variants implemented with conditional class strings, no headless-ui or radix.
- **No `any` or `as` casts** to satisfy types.
- **Run `pnpm typecheck` and visual QA via `/browse`** after every batch of replacements. A primitive replacement that subtly changes layout is a regression.
- **Don't refactor for the sake of refactoring.** Three feature copies of a unique pattern is the bar for promotion. Two is fine to leave.

## Verification

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Visual QA via `/browse`:

- `/questions` (empty + populated)
- `/ask`
- `/questions/[any-id]`
- `/cxc-ai` (empty + populated)
- `/login`
- `/users/[any-id]`
- `/settings`

Side-by-side with the canonical image where applicable. The four panels must still match.

## Output

Commit in logical chunks (`refactor(ui): promote SourceCard primitive`, `refactor(ui): replace inline buttons with <Button>`, etc.).

Write `docs/build/proposals/component-reuse.md` with:

- **Inventory:** every primitive and its current usage count
- **Replacements:** every inline copy replaced with a primitive (file:line, before/after)
- **Promotions:** every new primitive lifted into `packages/ui` (with a justification — should be a 3+-feature pattern)
- **Left as-is with reason:** every inline component you considered but didn't touch
- **API drift:** primitives whose prop API doesn't match real usage (suggested fix)

## Boundaries

You own:

- `packages/ui/src/**` (primitives + tokens, but tokens are A4's territory — touch only when adding a new primitive that needs a new token; otherwise leave tokens alone)
- `apps/web/frontend/features/**/components/**/*.tsx`

Stay out of:

- `apps/web/backend/**`
- `apps/web/app/globals.css` (audit A4's territory)
- DB schema, types, contracts (audits A1, A2)
- Auth components specifically — they shipped recently and may still be in flux. If you find duplication there, flag it; don't refactor it this round.

If audit A4 (color/font/css) is running concurrently and you both touch a primitive, A3 owns the JSX/component shape; A4 owns the CSS variable / token references inside it.

## Report back

≤250 words. Inventory counts, replacement counts, promotion counts, blockers.
