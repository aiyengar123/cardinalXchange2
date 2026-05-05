# Audit A4 — Colors, Fonts, Tokens, and `globals.css`

## The principle

The user's exact direction: "color, index css, fonts ... components are reused."

Translation: every color, font, spacing, and radius value in the codebase should resolve through a single canonical source — `apps/web/app/globals.css` CSS variables, mirrored from `packages/ui/src/tokens/`. Anywhere a hex code, a `rgb()`, a `font-family: ...` literal, or a one-off `border-radius: 12px` appears in a component class string is a violation.

Goal: **one place to change a color, one place to change a font, one place to change a radius scale.** Nothing hardcoded outside the tokens.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading

1. `apps/web/app/globals.css` — the canonical token source.
2. `packages/ui/src/tokens/colors.ts`, `radius.ts`, `spacing.ts`, `typography.ts` — TS mirrors of the CSS vars.
3. `apps/web/app/fonts.ts` — `next/font/google` setup (Inter + JetBrains Mono).
4. `apps/web/app/layout.tsx` — where the font CSS variables are wired onto `<html>`.
5. `STRUCTURE.md` "Naming Conventions" + design tokens references.
6. `docs/build/04-design.md` — design philosophy + don'ts list.

## What to find and fix

### Step 1 — Hardcoded color literals

Search for hex codes, rgb(), and named colors used outside the token files:

```bash
# Hex codes in component class strings (and CSS / TS files)
rg -n '#[0-9a-fA-F]{3,8}\b' apps/web --type tsx --type ts --type css \
  | grep -v '/tokens/' | grep -v '/globals.css' | grep -v 'token'

# rgb() / rgba() in components
rg -n 'rgb\(|rgba\(' apps/web --type tsx --type ts --type css \
  | grep -v '/globals.css'

# Tailwind named colors that aren't ours (e.g. red-500, blue-500, slate-900)
# These should never appear; we only have cardinal-, ink-, surface-, border-, state-.
rg -n '(bg|text|border|ring|fill|stroke|from|to|via)-(red|blue|green|yellow|purple|pink|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{2,3}' apps/web --type tsx
```

For every match:

- If it's a duplicate of an existing token (e.g., `#c8102e` literal where `var(--color-cardinal-500)` would do), **replace with the token**.
- If it's a color we don't have a token for, **decide**: add a token for it OR remove the hardcoded value if it's accidental. Prefer adding a semantic token (e.g., `--color-link-blue` for the markdown link color) over leaving raw hex.
- The `#0b66c2` link blue used in `markdown.tsx` is a known instance — promote it to a token (`--color-link` or `--color-link-blue`).

### Step 2 — Hardcoded font references

```bash
# Component class strings with font-family overrides
rg -n 'font-(family|sans|serif|mono):' apps/web --type tsx --type ts --type css \
  | grep -v '/globals.css' | grep -v '/fonts.ts'

# Inline font-family in className
rg -n "fontFamily:" apps/web --type tsx
```

Every font reference outside `globals.css` and `fonts.ts` should be either:

- A Tailwind utility (`font-sans`, `font-mono`) which resolves through `--font-sans` / `--font-mono` thanks to `@theme inline`, or
- Removed.

Inter is the only sans family. JetBrains Mono is the only mono. There is no serif anymore (we aliased `--font-serif` to sans).

### Step 3 — Hardcoded radius / spacing / shadow values

Tailwind v4 generates `gap-N`, `p-N`, `rounded-N` from the `--spacing` and `--radius-N` tokens. Anywhere a component does `style={{ padding: "13px" }}` or `borderRadius: "12px"` is bypassing the system.

```bash
# Inline style props with px values
rg -n 'style=\{\{[^}]*(padding|margin|gap|borderRadius|fontSize|width|height):\s*"[0-9]+px"' apps/web --type tsx

# Arbitrary Tailwind values with px (some are ok like `top-[68px]` for sticky, but most aren't)
rg -n '\[(\d+px)\]' apps/web --type tsx
```

For each match:

- If a token exists, replace with the token utility (`p-3`, `rounded-md`, etc.).
- If the value is intentional (e.g., `top-[68px]` matches the `h-[68px]` top bar), leave but **promote to a CSS var** (`--header-height: 68px`) and reference the var so changing it once updates everywhere.

### Step 4 — `globals.css` audit

Open `apps/web/app/globals.css` and audit:

- Every `:root` variable should have a matching `@theme inline` line so Tailwind generates utilities.
- Every `@theme inline` line should reference a `:root` variable (no fresh values inside `@theme`).
- The `@source` directives at the top should still match the post-Wave-6 paths (`../frontend`, `../app`, etc.). Verify against `STRUCTURE.md`.
- The body / html base styles should not include hex codes — only var references.

### Step 5 — Token additions (only when needed)

If you add a new token (e.g., `--color-link-blue`):

1. Add to `:root` in `globals.css`.
2. Add to `@theme inline` so `bg-link-blue` / `text-link-blue` works.
3. Add to `packages/ui/src/tokens/colors.ts` so the static export stays in sync.
4. Update consumers.

Only add a token if 2+ places use the value. One-off hex codes get inlined at the call site (with a comment) but ideally are eliminated.

## Hard rules

- **`packages/ui` stays client-safe.**
- **No new dependencies.**
- **Don't change visual output.** A token swap should be a no-op visually. If the rendered page changes, you broke something.
- **Run visual QA via `/browse`** after every batch on `/questions`, `/ask`, `/questions/[id]`, `/cxc-ai`, `/login`, `/users/[id]`, `/settings`.
- **Don't refactor for refactor's sake.** A `bg-white` in a one-off component is fine — `surface-base` exists if multiple places need it.
- **Don't break the Tailwind v4 `--spacing` and radius tokens** (they exist post-Wave-6 fix; verify before touching `globals.css`).

## Verification

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

Visual QA: spot-check at 1440x900 on every route. Side-by-side with the canonical image where applicable.

## Output

Commit in logical chunks (`refactor(tokens): promote link blue to --color-link`, etc.).

Write `docs/build/proposals/tokens-and-css.md` with:

- **Inventory:** every hardcoded color/font/radius found, where, and the resolution
- **New tokens added** (with justification: 2+ consumers)
- **Tokens removed/renamed** (and migration done)
- **Anything intentionally left hardcoded** (like sticky `top-[68px]`) with reasoning
- **Final globals.css** sanity check: vars match `@theme inline`, sources still right

## Boundaries

You own:

- `apps/web/app/globals.css`
- `packages/ui/src/tokens/**`
- `apps/web/app/fonts.ts` (only if a font change is needed — usually leave alone)
- Hardcoded color/font/radius **values** anywhere in the codebase, but ONLY if the change is a literal token-swap (not a refactor of the surrounding component)

Stay out of:

- Component **shape** changes (audit A3's territory)
- Backend types and DTOs (audits A1, A2)
- DB schema

If audit A3 is running concurrently, A3 owns JSX shape; you own CSS variable / token references inside the JSX. Coordinate via short, frequent commits.

## Report back

≤250 words. Counts (hardcoded colors found / fixed, hardcoded fonts found / fixed, new tokens added), one before/after sample, blockers.
