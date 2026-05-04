import type { ReactNode } from "react";

import { PageShell } from "@/features/shell";

/**
 * Default forum shell: cardinal-red top bar, TopicRail on the left, the
 * 720px-capped main column, and the SideRail on the right. Used for the
 * questions feed, question detail, and the ask form.
 */
export default function ForumLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
