# 04 · Design System

Brief for the **Design-System Agent**. Owns `packages/ui` and `apps/web/app/globals.css`. Publishes tokens and primitives that every other layer consumes.

## Image

`file:///Users/adarshambati/.codex/generated_images/019df135-24c1-79a2-b26a-61ae7cb801cf/ig_05b26d49161640ea0169f843e750e8819593ca9a21bbce2e7d.png`

Match the look. Cardinal-red accent, white surface, dark text, generous whitespace, dense rows. Looks like a serious academic forum, not a SaaS landing page.

## Design Philosophy

- **Square over curved.** Default border-radius is `0`. Allowed exceptions: top-of-page titles or display headlines that lean editorial; the cardinal-red brand button can be square as well — keep curves out of body UI. Curved cards/rounded-2xl/glassmorphism read as "AI-generated UI" and are explicitly banned.
- **Border before shadow.** Use `1px` borders to separate surfaces, not drop shadows. Shadows only for active overlays (modals, popovers).
- **Type-first hierarchy.** Differentiate sections with weight and size, not color or background.
- **Content density on rows; whitespace on pages.** Question rows are tight; full pages breathe.
- **One accent.** Cardinal red is the only chromatic accent. Everything else is neutral.
- **No gradients, no glow, no decorative emojis.**
- **Motion is invisible.** Transitions ≤150ms, ease-out. No spring bounces.

## Tokens

`packages/ui/src/tokens/*` — typed TS, mirrored to CSS variables in `apps/web/app/globals.css`.

### Color

```ts
// tokens/colors.ts
export const colors = {
  cardinal: {
    50: '#fff1f1',
    500: '#8C1515', // Stanford cardinal
    600: '#7a1212',
    700: '#5e0e0e',
  },
  ink: {
    900: '#0a0a0a',
    700: '#2a2a2a',
    500: '#5a5a5a',
    300: '#a0a0a0',
    100: '#e6e6e6',
    50:  '#f5f5f5',
  },
  surface: {
    base: '#ffffff',
    sunk: '#fafafa',
  },
  border: {
    default: '#e6e6e6',
    strong:  '#d0d0d0',
    focus:   '#8C1515',
  },
  state: {
    danger:  '#b00020',
    success: '#0a6e3d',
  },
} as const;
```

### Radius

```ts
// tokens/radius.ts
export const radius = {
  none:    '0px',     // default
  hairline:'2px',     // inputs/buttons can use this if a hard 0 is too sharp
  title:   '6px',     // ONLY on top-of-page display titles or hero pills
} as const;
```

Default everywhere is `radius.none`. `radius.hairline` is the maximum allowed in body UI. `radius.title` is allowed only on hero/title surfaces.

### Spacing

```ts
// tokens/spacing.ts
export const spacing = {
  0: '0',     1: '4px',   2: '8px',   3: '12px',
  4: '16px',  5: '20px',  6: '24px',  8: '32px',
  10:'40px',  12:'48px',  16:'64px',  20:'80px',
} as const;
```

### Typography

Coded into the platform via `next/font` so we never depend on a CDN.

```ts
// apps/web/app/fonts.ts
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google';

export const sans  = Inter({ subsets:['latin'], variable:'--font-sans'  });
export const serif = Source_Serif_4({ subsets:['latin'], variable:'--font-serif' });
export const mono  = JetBrains_Mono({ subsets:['latin'], variable:'--font-mono' });
```

`<html>` in `app/layout.tsx` adds `${sans.variable} ${serif.variable} ${mono.variable}`.

```ts
// tokens/typography.ts
export const typography = {
  family: {
    sans:  'var(--font-sans),  ui-sans-serif, system-ui, sans-serif',
    serif: 'var(--font-serif), ui-serif, Georgia, serif',
    mono:  'var(--font-mono),  ui-monospace, SFMono-Regular, monospace',
  },
  size: {
    xs:  '12px',  sm:  '14px',  base:'16px',
    lg:  '18px',  xl:  '20px',  '2xl':'24px',
    '3xl':'30px', '4xl':'36px', '5xl':'48px',
  },
  weight:  { regular:400, medium:500, semibold:600, bold:700 },
  leading: { tight:1.2, snug:1.35, normal:1.5, relaxed:1.65 },
  tracking:{ tight:'-0.01em', normal:'0', wide:'0.02em' },
} as const;
```

Headlines (top-of-page titles): `serif`, `4xl`/`5xl`, `tight` leading, `tight` tracking. Body: `sans`, `base`, `relaxed` leading.

## CSS Variables (`apps/web/app/globals.css`)

Mirror tokens 1:1. Tailwind config (or arbitrary values) reads from these.

```css
:root {
  --color-cardinal-500: #8C1515;
  --color-ink-900: #0a0a0a;
  --color-ink-700: #2a2a2a;
  --color-ink-500: #5a5a5a;
  --color-ink-100: #e6e6e6;
  --color-surface-base: #ffffff;
  --color-surface-sunk: #fafafa;
  --color-border-default: #e6e6e6;
  --color-border-focus:   #8C1515;

  --radius-none: 0px;
  --radius-hairline: 2px;
  --radius-title: 6px;

  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;

  --shadow-overlay: 0 8px 24px rgba(0,0,0,0.08);
}

html, body {
  background: var(--color-surface-base);
  color: var(--color-ink-900);
  font-family: var(--font-sans), system-ui, sans-serif;
}

*, *::before, *::after { border-radius: var(--radius-none); }

::selection { background: var(--color-cardinal-500); color: #fff; }
```

## Primitives (`packages/ui/src/primitives`)

Each primitive is a typed React component, default-exported, that accepts variant props. All primitives default to square corners.

- `Button` — variants: `primary` (cardinal-red bg, white text), `secondary` (white bg, ink-900 text, 1px border), `ghost` (transparent, hover ink-50). Sizes: `sm`, `md`, `lg`. Square corners.
- `Badge` / `Tag` — square, 1px border, sm text. Used for question tags.
- `Surface` — square card with optional `sunk` background.
- `Input` / `Textarea` — square, 1px border, 2px cardinal-red focus outline.
- `IconButton` — square 32×32.
- `Divider` — 1px ink-100 line.
- `Pill` — only used for AI source labels; square with 1px border (despite the name; it's a label, not a curved capsule).

Primitives never render fonts that aren't in the typography tokens, never accept arbitrary `borderRadius`, and never accept arbitrary colors outside the token scale.

## Static `designSystem` Export

`packages/ui/src/index.ts` re-exports `{ colors, radius, spacing, typography }` as a single `designSystem` object. Other packages may read it for documentation/preview, but it is not the runtime style source — globals.css + Tailwind config is.

## Component Library Boundaries

- `packages/ui` is **client-safe**. No server, db, ai, auth imports — ever.
- Feature-specific composites (e.g., `QuestionRow`) live in `apps/web/features/<feature>/components`, not in `packages/ui`.
- If three features need the same primitive, lift it into `packages/ui`. Two does not yet justify a lift.

## Dark Mode

Out of scope for build 1. Token names are color-named (not semantic) so a future dark mode introduces a parallel palette without renaming everything. Don't ship a half-toggle.

## Don'ts (these read as AI slop)

- Rounded-2xl cards.
- Soft drop shadows on every card.
- Pastel gradient backgrounds.
- Hero sections with floating glassmorphic panels.
- Emojis in primary UI labels.
- `bg-gradient-to-r from-pink-500 to-violet-500` anywhere, ever.

## Completion Note

```
## Completion Note
- What changed: 
- Open questions for next agent: 
- Image cross-check: 
```
