import type { ReactNode } from "react";

import { cn } from "@cardinalxchange/ui";

import { SideRail } from "@/features/shell/components/side-rail";
import { TopCommandBar } from "@/features/shell/components/top-command-bar";
import { TopicRail } from "@/features/shell/components/topic-rail";

type PageShellProps = {
  children: ReactNode;
  /** Optional second left-side rail rendered between TopicRail and main. */
  secondaryRail?: ReactNode;
  /**
   * Right-side rail. Pass `null` to hide on this route. Pass `undefined`
   * (default) to render the standard `<SideRail />`.
   */
  sideRail?: ReactNode | null;
  /** Optional override for main content max-width. Default `max-w-[720px]`. */
  mainMaxWidthClass?: string;
};

/**
 * Composes the cardinal-red top bar, the left rail(s), the centered main
 * column, and the right side rail. Default proportions mirror Stack
 * Overflow's shell: a 1264px container with rail (~164px), main (capped at
 * ~720px), and a side rail (~300px).
 *
 * Slots:
 *   - `secondaryRail` renders between `TopicRail` and `<main>` (used by
 *     `/cxc-ai` for a chat-history rail). When provided, the default 720px
 *     cap on `<main>` is dropped so the chat surface can use the full width.
 *   - `sideRail` defaults to `<SideRail />`. Pass `null` to hide it.
 *   - `mainMaxWidthClass` overrides the `<main>` max-width class.
 */
export function PageShell({
  children,
  secondaryRail,
  sideRail,
  mainMaxWidthClass,
}: PageShellProps) {
  const resolvedSideRail = sideRail === undefined ? <SideRail /> : sideRail;
  const resolvedMainMaxWidth =
    mainMaxWidthClass ?? (secondaryRail ? "max-w-none" : "max-w-[720px]");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-base)] text-[var(--color-ink-900)]">
      <TopCommandBar />
      <div className="mx-auto flex w-full max-w-[1264px] flex-1 min-h-0 gap-6 px-4 sm:px-6">
        <TopicRail />
        {secondaryRail}
        <main className={cn("flex-1 min-w-0 py-6", resolvedMainMaxWidth)}>
          {children}
        </main>
        {resolvedSideRail}
      </div>
    </div>
  );
}

export default PageShell;
