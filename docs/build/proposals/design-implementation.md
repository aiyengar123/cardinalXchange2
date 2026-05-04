# Design Implementation — Build 1, Wave 2

Author: Design-System Agent
Inputs: `docs/build/04-design.md`, `docs/build/proposals/structure-implementation.md`, `docs/build/01-organization.md`, `CLAUDE.md`, image at `~/.codex/generated_images/.../ig_05b26d49…ce.png`.

The Design-System Agent owns `packages/ui/`, `apps/web/app/globals.css`, and font wiring (`apps/web/app/fonts.ts` + the `<html>` className in `apps/web/app/layout.tsx`). No feature components were touched — `apps/web/features/**` and `apps/web/components/**` remain Frontend-Agent territory.

## Tokens shipped

All tokens live under `packages/ui/src/tokens/` and are re-exported by `packages/ui/src/tokens/index.ts`.

| File | Export | Shape |
|---|---|---|
| `tokens/colors.ts` | `colors`, `ColorTokens` | `{ cardinal: { 50, 500, 600, 700 }, ink: { 50, 100, 300, 500, 700, 900 }, surface: { base, sunk }, border: { default, strong, focus }, state: { danger, success } }` |
| `tokens/radius.ts` | `radius`, `RadiusTokens` | `{ none: '0px', hairline: '2px', title: '6px' }` |
| `tokens/spacing.ts` | `spacing`, `SpacingTokens` | 4px scale: `{ 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20 }` |
| `tokens/typography.ts` | `typography`, `TypographyTokens` | `{ family: { sans, serif, mono }, size: xs..5xl, weight: { regular, medium, semibold, bold }, leading: { tight, snug, normal, relaxed }, tracking: { tight, normal, wide } }` |

`packages/ui/src/index.ts` rolls them into a single `designSystem` object plus a `DesignSystem` type, alongside the primitives barrel and the `cn` util.

The legacy `packages/ui/src/design.ts` (graphite/gold palette, paper background, `rounded-md` radii) was removed — its public exports were unused outside `packages/ui/src/index.ts`.

## Fonts

Loaded via `next/font/google` only — no CDN `<link>` tags, no new dependencies.

| Family | Role | CSS variable | File |
|---|---|---|---|
| `Inter` | sans (UI body) | `--font-sans` | `apps/web/app/fonts.ts` |
| `Source_Serif_4` | serif (titles/headlines) | `--font-serif` | `apps/web/app/fonts.ts` |
| `JetBrains_Mono` | mono (code) | `--font-mono` | `apps/web/app/fonts.ts` |

The variables are wired onto `<html>` in `apps/web/app/layout.tsx` via `className={`${sans.variable} ${serif.variable} ${mono.variable}`}`. Layout was edited solely for that wiring — nav, shell, and metadata are untouched.

## CSS variables

Written to `apps/web/app/globals.css` under `:root`, mirrored 1:1 to the TS tokens. Tailwind v4's `@theme inline` block re-aliases them so `bg-cardinal-500`, `text-ink-900`, `border-border-default`, `font-serif`, etc. all resolve to the same source.

```
--color-cardinal-50, --color-cardinal-500, --color-cardinal-600, --color-cardinal-700
--color-ink-50, --color-ink-100, --color-ink-300, --color-ink-500, --color-ink-700, --color-ink-900
--color-surface-base, --color-surface-sunk
--color-border-default, --color-border-strong, --color-border-focus
--color-state-danger, --color-state-success
--radius-none, --radius-hairline, --radius-title
--space-0, --space-1, --space-2, --space-3, --space-4, --space-5, --space-6, --space-8, --space-10, --space-12, --space-16, --space-20
--text-xs, --text-sm, --text-base, --text-lg, --text-xl, --text-2xl, --text-3xl, --text-4xl, --text-5xl
--leading-tight, --leading-snug, --leading-normal, --leading-relaxed
--tracking-tight, --tracking-normal, --tracking-wide
--shadow-overlay (overlays only — no body card shadows)
```

Global rules:

- `html, body { background: var(--color-surface-base); color: var(--color-ink-900); font-family: var(--font-sans), … }`
- `*, *::before, *::after { border-radius: var(--radius-none); }` — square-corner default everywhere.
- `::selection { background: var(--color-cardinal-500); color: #fff; }`
- `button, input, textarea, select { font: inherit; }`
- Tailwind sources: `../components`, `../features`, `../lib`, `../../../packages/ui/src`.

## Primitives shipped

All under `packages/ui/src/primitives/`. Every primitive defaults to square corners and only exposes typed variants — no arbitrary `borderRadius`, no off-token colors. Each is named-exported and (for ergonomics) default-exported.

| Name | File | Variants / sizes | Exported props |
|---|---|---|---|
| `Button` | `primitives/button.tsx` | `variant`: `primary` (cardinal bg, white text) / `secondary` (white bg, ink-900, 1px border) / `ghost` (transparent, hover ink-50). `size`: `sm` / `md` / `lg`. | `ButtonProps`, `ButtonVariant`, `ButtonSize` |
| `Badge` | `primitives/badge.tsx` | `tone`: `neutral` / `accent`. Square 1px border, `text-xs`. | `BadgeProps`, `BadgeTone` |
| `Tag` | `primitives/tag.tsx` | Re-export of `Badge` (same shape per brief). | `TagProps`, `TagTone` |
| `Surface` | `primitives/surface.tsx` | `variant`: `base` / `sunk`. 1px border, no shadow. | `SurfaceProps`, `SurfaceVariant` |
| `Input` | `primitives/input.tsx` | Square, 1px border, 2px cardinal-red focus ring (inset), `forwardRef`'d. | `InputProps` |
| `Textarea` | `primitives/textarea.tsx` | Same look as `Input`, `forwardRef`'d, `resize-y`. | `TextareaProps` |
| `IconButton` | `primitives/icon-button.tsx` | 32×32 square. `variant`: `default` / `ghost`. Requires `aria-label`. | `IconButtonProps`, `IconButtonVariant` |
| `Divider` | `primitives/divider.tsx` | 1px ink-100 line, `orientation`: `horizontal` (default) / `vertical`. | `DividerProps` |
| `Pill` | `primitives/pill.tsx` | Square (despite the name). `tone`: `neutral` / `accent`. Used for AI source labels. | `PillProps`, `PillTone` |

`packages/ui/src/primitives/index.ts` re-exports every component and prop type. `packages/ui/src/index.ts` then `export * from "./primitives"`.

## Open questions for Frontend Agent

1. **Import path.** Use `@cardinalxchange/ui` only — never deep-import (`@cardinalxchange/ui/src/primitives/button` etc.). The package's `exports` field only publishes the root barrel.
2. **Tailwind palette renamed.** The legacy `bg-paper`, `text-graphite-*`, `bg-cardinal-700/800/900/950`, `border-graphite-200`, `bg-emerald-*` classes no longer resolve — only the new tokens do (`bg-cardinal-500/600/700`, `text-ink-*`, `border-border-default`, `bg-surface-base/sunk`). Existing classes in `apps/web/features/shell/components/top-command-bar.tsx`, `apps/web/features/shell/components/topic-rail.tsx`, `apps/web/features/questions/components/question-feed.tsx`, `apps/web/features/questions/components/question-row.tsx`, and `apps/web/app/layout.tsx`'s body wrapper (`bg-paper text-graphite-950`) need to be migrated. Typecheck/lint don't catch class-name drift — visual QA will.
3. **Form composition.** `Input` and `Textarea` are unstyled at the field level beyond border + focus ring. Wrap them in a `<label className="flex flex-col gap-1"><span className="text-sm font-medium">…</span><Input /></label>` pattern, or build a feature-local `FormField` composite — do not lift one into `packages/ui` until three features need it.
4. **Square-corner override.** Anything that needs `radius.hairline` or `radius.title` must opt in explicitly, e.g. `style={{ borderRadius: 'var(--radius-title)' }}` on a hero h1. The global `* { border-radius: var(--radius-none) }` rule will otherwise win.
5. **`Tag` vs `Badge`.** Identical primitive — pick the import that reads best. Question topic tags should use `Tag`; AI source labels should use `Pill`.
6. **No `cardinal-700` direct usage.** The cardinal scale is intentionally narrow (`50/500/600/700`) — `500` is the brand, `600` is hover, `700` is active/pressed. Do not introduce `400`/`800`/`900`.
7. **Cardinal accent is the only chromatic color.** Errors should use `var(--color-state-danger)` (a tuned dark red, not cardinal) and success uses `var(--color-state-success)`. Both are sparingly applied and never decorative.
8. **Body container.** The `<div className="bg-paper text-graphite-950 min-h-screen">` wrapper in `apps/web/app/layout.tsx` is now dead-class. The Frontend Agent should swap it for `bg-surface-base text-ink-900 min-h-screen` (or just remove the wrapper since `body` already sets bg/color via globals.css).

## Verification

| Command | Status |
|---|---|
| `pnpm typecheck` | exit 0 — all four workspaces (config, db, ui, web) pass. |
| `pnpm lint` | exit 0 — all four workspaces pass with `--max-warnings=0`. |
| `pnpm build --filter @cardinalxchange/ui` | exit 0 — runs `tsc --noEmit` (the UI package's `build` is aliased to typecheck per `package.json`). The Turbo "no output files" warning is benign for a typecheck-only target. |

## Image cross-check

- Top bar: cardinal-red on `--color-cardinal-500` with white text — covered by `Button variant="primary"` and a future shell wrapper.
- Left rail: monochrome ink labels on white — covered by `ghost` button variants and `Divider`.
- Question rows: tight density, square 1px tag pills — covered by `Tag` (1px border, `text-xs`).
- Ask form: square inputs with cardinal focus ring — covered by `Input` / `Textarea`.
- Question detail: square `Surface` cards, 1px borders, no drop shadows — covered by `Surface variant="base"` and `Surface variant="sunk"`.
- CXC AI source labels: square pills — covered by `Pill`.
