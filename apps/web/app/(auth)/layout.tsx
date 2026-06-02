import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--color-surface-canvas)] text-[var(--color-ink-900)]">
      <header className="border-b border-[var(--color-border-default)] bg-white">
        <div className="mx-auto flex max-w-[var(--shell-max-width)] items-center px-4 py-3 sm:px-6">
          <Link
            aria-label="cardinalXchange home"
            className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--color-cardinal-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
            href="/questions"
          >
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-cardinal-500)] text-xs leading-none font-bold text-white"
            >
              cXc
            </span>
            <span>cardinalXchange</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-[420px] flex-col gap-6 px-6 py-12 sm:py-20">
        {children}
      </main>
    </div>
  );
}
