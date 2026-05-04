import { getAiChatSnapshot } from "@/backend/cxc-ai/services/chat.service";
import { jsonError, jsonOk } from "@/backend/http/http";

type RouteContext = {
  params: Promise<{ chatId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { chatId } = await context.params;
    const snapshot = await getAiChatSnapshot(chatId);
    return jsonOk(snapshot);
  } catch (error) {
    return jsonError(error);
  }
}

