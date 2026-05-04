import type { Metadata, Viewport } from "next";

import { mono, sans, serif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardinalXchange",
  description:
    "A Stanford-focused Q&A forum for clear questions and durable answers.",
};

export const viewport: Viewport = {
  themeColor: "#8c1515",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
