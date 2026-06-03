import type { ReactNode } from "react";

import { PageShell } from "@/features/shell";

/**
 * Forum shell: white top bar, TopicRail on the left, no right SideRail.
 * Container is centered with mx-auto so whitespace flows symmetrically
 * outside the content on wide viewports — Stack Overflow style.
 */
export default function ForumLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell
      containerClassName="mx-auto max-w-[var(--shell-max-width)] px-4 sm:px-6"
      mainMaxWidthClass="max-w-none"
    >
      {children}
    </PageShell>
  );
}
