import { getActiveStream } from "@/server/cxc-ai/services/stream-registry";
import { HttpError, jsonError } from "@/server/http/http";

type RouteContext = {
  params: Promise<{ chatId: string }>;
};

/**
 * Reattach to an in-flight assistant turn for `chatId`. Replays any chunks
 * already buffered, then forwards live chunks until the upstream producer
 * closes. Returns 204 if no active stream exists (already finished + TTL
 * elapsed, or no turn has started).
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const chatId = decodeURIComponent(params.chatId ?? "").trim();
    if (!chatId) {
      throw new HttpError(400, "missing_chat_id", "chatId is required.");
    }

    const active = getActiveStream(chatId);
    if (!active) {
      return new Response(null, { status: 204 });
    }

    return new Response(active.attach(), {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
