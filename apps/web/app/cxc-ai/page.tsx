import { randomUUID } from "node:crypto";

import { ChatShell } from "@/features/cxc-ai";

export const dynamic = "force-dynamic";

export default async function CxcAiIndexPage() {
  // Generate a session id locally — the row is only persisted on the first
  // user send (via `ensureAiChatSession` inside the streaming route handler).
  // Avoids minting empty `AiChatSession` rows on idle visits / bot crawls.
  const chatId = randomUUID();

  return <ChatShell chatId={chatId} initialMessages={[]} isNewChat />;
}
