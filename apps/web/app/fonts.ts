import { Inter, JetBrains_Mono } from "next/font/google";

/**
 * Font wiring for the web app. Loaded via `next/font` so we never depend
 * on a CDN. Inter is the single display + body family — the legacy
 * `font-serif` class is aliased to Inter inside `globals.css` so existing
 * usage keeps rendering without per-file edits.
 */

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
