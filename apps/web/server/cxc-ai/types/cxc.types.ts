// Server-internal CXC AI types. Wire DTOs (AiChatSession, AiChatMessage,
// AiChatSource, AskCommunityDraft, AiChatSnapshot, AiChatSourceKind) cross
// the wire to the client and live in `apps/web/server/http/contracts.ts`
// per the Shared Types Policy.

import type { AiChatSource } from "@/server/http/contracts";

export type CxcAgentInvocation = {
  chatId: string;
  query: string;
  sources: AiChatSource[];
};

export type CxcRetrievalScope = {
  /** When true, opt-in web context is consulted; ignored if endpoint unset. */
  includeWeb?: boolean;
  limit?: number;
  tags?: string[];
};
