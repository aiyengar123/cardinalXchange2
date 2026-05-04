/**
 * Radius tokens.
 *
 * Square corners are the default everywhere. `hairline` is the maximum allowed
 * in body UI; `title` is reserved for top-of-page display titles or hero pills.
 */
export const radius = {
  none: "0px",
  hairline: "2px",
  title: "6px",
} as const;

export type RadiusTokens = typeof radius;
