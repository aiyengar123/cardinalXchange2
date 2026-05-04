/**
 * Typography tokens.
 *
 * Family stacks reference the CSS variables wired up by `next/font` in
 * `apps/web/app/fonts.ts`. Headlines: `serif`, `4xl`/`5xl`, tight leading,
 * tight tracking. Body: `sans`, `base`, relaxed leading.
 */
export const typography = {
  family: {
    sans: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
    serif: "var(--font-serif), ui-serif, Georgia, serif",
    mono: "var(--font-mono), ui-monospace, SFMono-Regular, monospace",
  },
  size: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "20px",
    "2xl": "24px",
    "3xl": "30px",
    "4xl": "36px",
    "5xl": "48px",
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  leading: {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.65,
  },
  tracking: {
    tight: "-0.01em",
    normal: "0",
    wide: "0.02em",
  },
} as const;

export type TypographyTokens = typeof typography;
