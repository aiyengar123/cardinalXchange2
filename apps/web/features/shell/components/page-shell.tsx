import type { ReactNode } from "react";

import { SideRail } from "@/features/shell/components/side-rail";
import { TopCommandBar } from "@/features/shell/components/top-command-bar";
import { TopicRail } from "@/features/shell/components/topic-rail";

/**
 * Composes the cardinal-red top bar, the left rail, the centered main
 * column, and the right side rail. Proportions mirror Stack Overflow's
 * shell: a 1264px container with rail (~164px), main (capped at ~720px),
 * and a side rail (~300px). On wide screens, whitespace flows symmetrically
 * outside the container instead of dumping on one side of the content.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-surface-base)] text-[var(--color-ink-900)]">
      <TopCommandBar />
      <div className="mx-auto flex w-full max-w-[1264px] flex-1 min-h-0 gap-6 px-4 sm:px-6">
        <TopicRail />
        <main className="flex-1 min-w-0 max-w-[720px] py-6">{children}</main>
        <SideRail />
      </div>
    </div>
  );
}

export default PageShell;
