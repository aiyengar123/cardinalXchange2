import { notFound } from "next/navigation";

import { ChatShell } from "@/features/cxc-ai";
import { findAiChatSnapshot } from "@/server/cxc-ai/services/chat.service";

type CxcAiChatPageProps = {
  params: Promise<{ chatId: string }>;
};

export default async function CxcAiChatPage({ params }: CxcAiChatPageProps) {
  const { chatId } = await params;
  const snapshot = await findAiChatSnapshot(chatId);

  // Visiting an unknown chat id should not silently mint a phantom row —
  // 404 instead so the rail and the chat surface stay honest.
  if (!snapshot) {
    notFound();
  }

  return <ChatShell chatId={chatId} initialMessages={snapshot.messages} />;
}
