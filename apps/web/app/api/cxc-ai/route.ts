import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

import {
  buildCxcAiSystemPrompt,
  buildFallbackAnswer,
  createCxcAiTools,
  cxcAiModelName,
  cxcAiStopWhen,
  getLatestUserText,
} from "@/server/cxc-ai/agents/cxc.agent";
import { replaceAiChatMessages } from "@/server/cxc-ai/services/chat.service";
import { retrievePublicQuestionAnswerSources } from "@/server/cxc-ai/services/retrieval.service";
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

    // Persist the user-side of the turn before we begin streaming. The
    // assistant message (and its sources) are persisted again at stream
    // completion via the AI SDK consumer once it forwards the final
    // `messages` array.
    await replaceAiChatMessages(chatId, messages, sources);

    return createUIMessageStreamResponse({
      stream: createUIMessageStream({
        async execute({ writer }) {
          sources.forEach((source) => {
            writer.write({
              type: "source-url",
              sourceId: source.id,
              url: source.url,
              title: `${source.label}: ${source.title}`,
            });
          });

          if (!process.env.OPENAI_API_KEY) {
            const textId = `fallback-${Date.now().toString(36)}`;
            writer.write({ type: "text-start", id: textId });
            writer.write({
              type: "text-delta",
              id: textId,
              delta: buildFallbackAnswer(latestUserText, sources),
            });
            writer.write({ type: "text-end", id: textId });
            return;
          }

          const result = streamText({
            model: openai(cxcAiModelName),
            system: buildCxcAiSystemPrompt(sources),
            messages: await convertToModelMessages(messages),
            tools: createCxcAiTools(),
            stopWhen: cxcAiStopWhen,
            maxOutputTokens: 900,
          });

          writer.merge(result.toUIMessageStream());
        },
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
