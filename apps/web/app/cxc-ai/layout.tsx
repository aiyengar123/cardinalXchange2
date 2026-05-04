import type { ReactNode } from "react";

import { ChatHistoryRail } from "@/features/cxc-ai";
import { PageShell } from "@/features/shell";
import { listAiChatSessions } from "@/server/cxc-ai/services/chat.service";

export const dynamic = "force-dynamic";

/**
 * CXC AI shell: TopicRail on the left, ChatHistoryRail as a second left
 * rail, no SideRail on the right, and a wide main column for the chat
 * surface.
 */
export default async function CxcAiLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sessions = await listAiChatSessions();

  return (
    <PageShell
      mainMaxWidthClass="max-w-none"
      secondaryRail={<ChatHistoryRail sessions={sessions} />}
      sideRail={null}
    >
      {children}
    </PageShell>
  );
}
