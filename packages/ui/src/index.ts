/**
 * Public surface of `@cardinalxchange/ui`.
 *
 * Tokens, primitives, and the `cn` className helper. This package is
 * client-safe — it must never import from `@cardinalxchange/db`, `@/backend/*`,
 * or any AI/auth code.
 *
 * Token usage note: the runtime style source is `apps/web/app/globals.css`
 * (CSS variables, mirrored into Tailwind via `@theme inline`). The TS
 * `colors` token is exported so a small number of server contexts can
 * read color values at build time (e.g. `viewport.themeColor` in the
 * Next root layout). Other token scales (spacing, radius, typography)
 * live only as CSS vars — adding TS mirrors when there's no consumer
 * is dead code.
 */

export { colors } from "./tokens";
export type { ColorTokens } from "./tokens";

export * from "./primitives";

export { cn } from "./utils/cn";
