/**
 * Color tokens.
 *
 * Stanford cardinal red is the only chromatic accent. Everything else is
 * neutral ink/surface/border so a future dark mode is purely additive.
 */
export const colors = {
  cardinal: {
    50: "#fdecef",
    500: "#c8102e", // vibrant cardinal red, cool undertone (not orange)
    600: "#a30c25",
    700: "#7a091c",
  },
  ink: {
    900: "#0a0a0a",
    700: "#2a2a2a",
    500: "#5a5a5a",
    300: "#a0a0a0",
    100: "#e6e6e6",
    50: "#f5f5f5",
  },
  surface: {
    base: "#ffffff",
    sunk: "#fafafa",
  },
  border: {
    default: "#e6e6e6",
    strong: "#d0d0d0",
    focus: "#c8102e",
  },
  state: {
    danger: "#b00020",
    success: "#0a6e3d",
  },
  link: {
    default: "#0b66c2",
    hover: "#084a8e",
  },
} as const;

export type ColorTokens = typeof colors;
