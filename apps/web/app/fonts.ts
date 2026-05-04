import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";

/**
 * Font wiring for the web app. Each family is loaded via `next/font` so we
 * never depend on a CDN, and exposed as a CSS variable consumed by
 * `globals.css` and the `typography` token in `@cardinalxchange/ui`.
 */

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
