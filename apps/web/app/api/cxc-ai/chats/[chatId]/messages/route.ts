import type { UIMessage } from "ai";

import { replaceAiChatMessages } from "@/server/cxc-ai/services/chat.service";
import { jsonError, jsonOk, readPayload } from "@/server/http/http";
import { parseCxcChatMessagesInput } from "@/server/http/inputs";

type RouteContext = {
  params: Promise<{ chatId: string }>;
};

/**
 * Manual sync endpoint. The streaming `POST /api/cxc-ai` handler is the
 * canonical durable write — it persists messages + sources via the AI SDK's
 * `onFinish` callback. This route stays as an idempotent client-side
 * refresh hint: if the client posts the finalized message array and that
 * matches what's already on disk, nothing user-visible changes.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { chatId } = await context.params;
    const payload = await readPayload(request);
    const parsed = parseCxcChatMessagesInput(payload);
    const messages = parsed.messages as unknown as UIMessage[];
    // Sources are intentionally undefined — we don't want to clobber the
    // sources persisted server-side at stream completion. The mutation
    // helper treats `undefined` as "leave sources alone".
    const snapshot = await replaceAiChatMessages(chatId, messages);
    return jsonOk(snapshot);
  } catch (error) {
    return jsonError(error);
  }
}
