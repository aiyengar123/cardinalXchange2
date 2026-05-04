import type { UIMessage } from "ai";

import { getLatestUserText } from "@/server/cxc-ai/agents/cxc.agent";
import {
  ensureAiChatSession,
  streamCxcAiTurn,
} from "@/server/cxc-ai/services/chat.service";
import { retrievePublicQuestionAnswerSources } from "@/server/cxc-ai/services/retrieval.service";
import type { AiChatMessage } from "@/server/http/contracts";
import { jsonError, readPayload } from "@/server/http/http";
import { parseCxcChatInput } from "@/server/http/inputs";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const payload = await readPayload(request);
    const parsed = parseCxcChatInput(payload);
    const chatId = parsed.id;
    // The zod schema validates the structural shape; AI SDK's UIMessagePart
    // union is too granular to express precisely with passthrough, so we
    // re-type after validation rather than narrowing every variant.
    const messages = parsed.messages as unknown as UIMessage[];
    const latestUserText = getLatestUserText(messages);
    const sources = await retrievePublicQuestionAnswerSources({
      query: latestUserText,
      limit: 6,
    });

    // Make sure the session row exists before streaming begins so the rail
    // can pick up new conversations on refresh. Full message + source
    // persistence happens in `streamCxcAiTurn`'s `onFinish` callback once
    // the assistant turn settles.
    await ensureAiChatSession(chatId, messages as unknown as AiChatMessage[]);

    return streamCxcAiTurn({ chatId, messages, sources });
  } catch (error) {
    return jsonError(error);
  }
}
