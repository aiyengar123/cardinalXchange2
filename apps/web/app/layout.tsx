import type { Metadata, Viewport } from "next";
import { colors } from "@cardinalxchange/ui";

import { mono, sans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "cardinalXchange",
  description:
    "A Stanford-focused Q&A forum for clear questions and durable answers.",
};

export const viewport: Viewport = {
  themeColor: colors.cardinal[500],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
