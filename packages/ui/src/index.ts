/**
 * Public surface of `@cardinalxchange/ui`.
 *
 * Tokens, primitives, and the `cn` className helper. This package is
 * client-safe — it must never import from `@cardinalxchange/db`, `@/server/*`,
 * or any AI/auth code.
 */

export {
  colors,
  radius,
  spacing,
  typography,
} from "./tokens";
export type {
  ColorTokens,
  RadiusTokens,
  SpacingTokens,
  TypographyTokens,
} from "./tokens";

import {
  colors as colorsTokens,
  radius as radiusTokens,
  spacing as spacingTokens,
  typography as typographyTokens,
} from "./tokens";

/**
 * Static, JSON-serialisable bundle of every token. Other workspaces may read
 * it for documentation/preview, but it is **not** the runtime style source —
 * `apps/web/app/globals.css` + Tailwind config own that.
 */
export const designSystem = {
  colors: colorsTokens,
  radius: radiusTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
} as const;

export type DesignSystem = typeof designSystem;

export * from "./primitives";

export { cn } from "./utils/cn";
