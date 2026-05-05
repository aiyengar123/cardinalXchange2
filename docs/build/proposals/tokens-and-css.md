# Audit A4 — Colors, fonts, tokens, and `globals.css`

Single source of truth for every color/font/spacing/radius value. Anything
hardcoded outside `apps/web/app/globals.css` + `packages/ui/src/tokens/*` was
treated as a violation and either swapped to a token or — when intentional and
single-use — documented below.

## TL;DR

- 4 hex literal color violations → **0** (all promoted to `--color-link`,
  `--color-link-hover`, or driven from `colors.cardinal[500]`).
- 1 `rgba()` shadow that exactly matched `--shadow-overlay` → swapped.
- 1 `rgba()` shadow that is genuinely one-off → kept inline, called out below.
- 0 hardcoded `font-family` literals (Inter / JetBrains Mono are wired through
  `next/font` and the `@theme inline` font slots only — no component overrides
  exist).
- 6 occurrences of `[68px]` and 4 occurrences of `max-w-[1600px]` → promoted to
  `--header-height` and `--shell-max-width` and referenced via
  `top-[var(--header-height)]` / `max-w-[var(--shell-max-width)]`.
- `--color-state-danger`, `--color-state-success`, `--color-link`,
  `--color-link-hover`, `--shadow-overlay` now mirrored into `@theme inline`
  so the audit's "every `:root` var has a matching `@theme` line" rule holds
  for the canonical token set.

## Inventory

### Color

| Where                                                            | Was                                                                                            | Now                                                                     |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/web/app/layout.tsx` `viewport.themeColor`                  | `"#c8102e"`                                                                                    | `colors.cardinal[500]` (TS import from `@cardinalxchange/ui`)           |
| `frontend/features/questions/components/markdown.tsx:379`        | `text-[#0b66c2]` `decoration-[#0b66c2]/40` `hover:text-[#084a8e]` `hover:decoration-[#084a8e]` | `text-[var(--color-link)]` etc., `hover:text-[var(--color-link-hover)]` |
| `frontend/features/questions/components/answer-composer.tsx:275` | `[&_a]:text-[#0b66c2]`                                                                         | `[&_a]:text-[var(--color-link)]`                                        |
| `apps/web/app/globals.css` `::selection`                         | `color: #ffffff`                                                                               | `color: var(--color-surface-base)`                                      |

### Shadows / `rgba()`

| Where                                                        | Was                                                              | Now                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------- |
| `frontend/features/cxc-ai/components/citation-bubble.tsx:90` | `shadow-[0_8px_24px_rgba(0,0,0,0.08)]`                           | `shadow-[var(--shadow-overlay)]` (exact value match) |
| `frontend/features/cxc-ai/components/chat-shell.tsx:100`     | `shadow-[0_4px_12px_rgba(0,0,0,0.08)]` (scroll-to-bottom button) | left inline — see "Intentional hardcodes" below      |

### Layout / `[…px]` arbitrary values

| Where (count)                                                                                          | Was                                                                             | Now                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `top-command-bar.tsx`, `topic-rail.tsx`, `chat-history-rail.tsx`, `chat-shell.tsx` (×6)                | `top-[68px]`, `h-[calc(100vh-68px)]`, `min-h-[calc(100vh-68px)]`, `sm:h-[68px]` | `top-[var(--header-height)]` / `[calc(100vh-var(--header-height))]` / `sm:h-[var(--header-height)]` |
| `app/(forum)/layout.tsx`, `app/cxc-ai/layout.tsx`, `app/(auth)/layout.tsx`, `top-command-bar.tsx` (×4) | `max-w-[1600px]`                                                                | `max-w-[var(--shell-max-width)]`                                                                    |

### Fonts

No violations found. `apps/web/app/fonts.ts` wires `Inter` and `JetBrains_Mono`
through `next/font`, exposes `--font-sans` / `--font-mono` on `<html>`, and
`globals.css` aliases `--font-serif` to sans. There were **0** `font-family:`
literals, **0** inline `fontFamily:` props, and **0** named-color Tailwind
utilities (`bg-red-500`, etc.) anywhere outside the token files.

### Hardcoded named colors not in scope

`bg-white` / `text-white` (~18 occurrences) and the literal `text-white` on
red CTAs were **left as Tailwind defaults**. They resolve to the same value as
`--color-surface-base` (`#ffffff`), so they are visually identical, and the
audit's named-color regex explicitly excluded `white`/`black`. If a future dark
mode lands, sweep them then.

## New tokens added

| Token                | Value     | Justification                                                       |
| -------------------- | --------- | ------------------------------------------------------------------- |
| `--color-link`       | `#0b66c2` | 2 consumers (markdown link, answer composer link styling)           |
| `--color-link-hover` | `#084a8e` | 2 consumers (markdown link hover text + decoration)                 |
| `--header-height`    | `68px`    | 6+ consumers (sticky offsets and `calc(100vh - …)` in 4 components) |
| `--shell-max-width`  | `1600px`  | 4+ consumers (forum, cxc-ai, auth layouts + top command bar)        |

`packages/ui/src/tokens/colors.ts` mirrors the new `link.default` /
`link.hover`. The radius/spacing/typography TS files were left at their
existing scopes — see "Known mismatches" below.

## Tokens removed / renamed

None.

## Intentional hardcodes (documented, not promoted)

- **`shadow-[0_4px_12px_rgba(0,0,0,0.08)]`** in `chat-shell.tsx:100` (the
  floating "scroll to latest" button). Single consumer, distinct from
  `--shadow-overlay` (which has a longer 24px blur). Audit rule: "Only add a
  token if 2+ places use the value." If a second floating-action shadow lands,
  promote it to `--shadow-floating`.
- **`bg-[var(--color-surface-canvas)]`** in `app/(auth)/layout.tsx:6`. The
  variable is **not defined** in `globals.css` so this currently resolves to
  the inherited body background (`--color-surface-base`, white). This is a
  pre-existing dangling reference predating A4; fixing it would change the
  resolved value (e.g., to `--color-surface-sunk`) and would not be a no-op
  visually, so it stays unchanged. **Follow-up:** decide whether to define
  `--color-surface-canvas` (e.g., point at `--color-surface-base`) or remove
  the wrapper class.
- **`font-serif` class usage on the markdown italic toolbar button** and a
  few headings. `--font-serif` in `@theme inline` is aliased to the sans stack
  on purpose, so this is fine — it ships Inter even when authors typed
  `font-serif`. Documented in `globals.css` comments.

## Known mismatches kept on purpose

- `packages/ui/src/tokens/radius.ts` exports only `none` / `hairline` /
  `title`. `globals.css` defines the full Tailwind v4 radius scale
  (`sm`/`md`/`lg`/`xl`/`2xl`/`3xl`/`full`) so utilities like `rounded-md`,
  `rounded-2xl` actually compile. The TS file is the **blessed list** for
  authors; `globals.css` is the **runtime palette**. Comment in `radius.ts`
  already documents this. Same pattern for `spacing.ts` (Tailwind v4 generates
  spacing utilities from a single `--spacing: 0.25rem` step, so per-step
  `--space-N` mirrors stay in `:root` for the TS export only).
- `--text-N`, `--leading-N`, `--tracking-N` are defined in `:root` but not
  echoed into `@theme inline`. Tailwind v4's built-in defaults already match
  these pixel values **and** include paired `--text-xs--line-height` etc. that
  we don't want to clobber. Adding `--text-xs: var(--text-xs)` to `@theme`
  would replace Tailwind's pair with a single var and could shift line-height.
  Skipped on the "no visual change" rule.

## Final `globals.css` sanity check

- `@source "../frontend"` ✓ (relative to `apps/web/app/globals.css`)
- `@source "../../../packages/ui/src"` ✓
- `apps/web/app/**` is auto-detected by Tailwind v4 from the entry CSS
  location, so no extra `@source` line is needed.
- Every meaningful runtime token in `:root` (cardinal, ink, surface, border,
  state, link, radius, header-height, shell-max-width, shadow-overlay) has a
  matching `@theme inline` line.
- `--spacing: 0.25rem` in `@theme inline` is preserved — required for
  `gap-N` / `p-N` / `m-N` / `space-y-N` to exist.
- `body` / `html` base styles reference only CSS vars; no hex codes left
  outside the `:root` definitions and the one rgba inside `--shadow-overlay`.
- `::selection` uses `var(--color-cardinal-500)` background and
  `var(--color-surface-base)` color (was literal `#ffffff`).

## Commits in this batch

1. `refactor(tokens): promote link blue + state colors to tokens` — `--color-link*`, `--color-state-*` mirrored into `@theme inline`, hex literals removed from `markdown.tsx` / `answer-composer.tsx`, `viewport.themeColor` driven from `colors.cardinal[500]`.
2. `refactor(tokens): promote --header-height + --shell-max-width` — 6 + 4 occurrences swapped, `::selection` color now reads `--color-surface-base`.
3. `refactor(tokens): citation bubble shadow uses --shadow-overlay` — exact-match swap.
4. `refactor(tokens): mirror --shadow-overlay into @theme inline` — closes Step 4 of the audit for the canonical set.

## Verification

- `pnpm --filter @cardinalxchange/web typecheck` ✓
- `pnpm --filter @cardinalxchange/web lint` ✓
- `pnpm --filter @cardinalxchange/web test` ✓ 16 files, 97 tests
- `pnpm --filter @cardinalxchange/web build` ✓ (the only console noise is the
  pre-existing `BETTER_AUTH_SECRET` warning during prerender — unrelated to
  this audit)
- `/browse` visual QA at 1440×900 on `/questions`, `/cxc-ai`, `/login`, and
  the markdown demo question detail — visual output identical to pre-batch.
