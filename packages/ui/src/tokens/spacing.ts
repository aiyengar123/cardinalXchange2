/**
 * Spacing tokens (4px scale).
 *
 * Numeric keys map directly to a multiple-of-4 pixel value (e.g. `spacing[4]`
 * is 16px). Use these everywhere to keep vertical/horizontal rhythm consistent.
 */
export const spacing = {
  0: "0",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
} as const;

export type SpacingTokens = typeof spacing;
