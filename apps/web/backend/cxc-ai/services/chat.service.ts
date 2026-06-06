import type { AiChatSessionRecord } from "@cardinalxchange/db";
import {
  createAiChatSessionRecord,
  ensureAiChatSessionRecord,
  getAiChatSessionRecord,
  listAiChatSessionRecords,
  replaceAiChatSessionMessages,
} from "@cardinalxchange/db";
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
} from "@/backend/cxc-ai/agents/cxc.agent";
import { citedSourceIndices } from "@/backend/cxc-ai/services/citation-extraction.service";
import { registerStream } from "@/backend/cxc-ai/services/stream-registry";
import type {
  AiChatMessage,
  AiChatSource,
  AiChatSession,
  AiChatSnapshot,
} from "@/backend/http/contracts";

export async function createAiChatSession(
  title = "New CXC AI chat",
): Promise<AiChatSession> {
  const record = await createAiChatSessionRecord(title);
  return toSessionDto(record);
}

export async function ensureAiChatSession(
  chatId: string,
  messages: AiChatMessage[] = [],
): Promise<AiChatSession> {
  const record = await ensureAiChatSessionRecord(chatId, inferTitle(messages));
  return toSessionDto(record);
}

export async function getAiChatSnapshot(
  chatId: string,
): Promise<AiChatSnapshot> {
  const record = await getAiChatSessionRecord(chatId);
  if (!record) {
    const session = await ensureAiChatSession(chatId);
    return { session, messages: [] };
  }

  return {
    session: toSessionDto(record),
    messages: record.messages.map(toMessageDto),
  };
}

/**
 * Read-only snapshot lookup. Returns `null` when the session does not exist
 * — used by `/cxc-ai/[chatId]` to render a real 404 instead of silently
 * minting a phantom row on an invalid id.
 */
export async function findAiChatSnapshot(
  chatId: string,
): Promise<AiChatSnapshot | null> {
  const record = await getAiChatSessionRecord(chatId);
  if (!record) {
    return null;
  }

  return {
    session: toSessionDto(record),
    messages: record.messages.map(toMessageDto),
  };
}

export async function listAiChatSessions(): Promise<AiChatSession[]> {
  const records = await listAiChatSessionRecords();
  return records.map(toSessionDto);
}

export async function replaceAiChatMessages(
  chatId: string,
  messages: AiChatMessage[],
  sources?: AiChatSource[],
): Promise<AiChatSnapshot> {
  const record = await replaceAiChatSessionMessages(
    chatId,
    inferTitle(messages),
    messages.map(toPersistedMessageInput),
    sources?.map(toPersistedSourceInput),
  );

  return {
    session: toSessionDto(record),
    messages: record.messages.map(toMessageDto),
  };
}

/**
 * True when the OpenAI model is reachable. Reading the env var lives inside
 * the service tier per the brief: route handlers must not branch on
 * `OPENAI_API_KEY` directly.
 */
export function isModelConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

type StreamCxcAiTurnArgs = {
  chatId: string;
  /** UI messages from the client (user-side already includes the latest turn). */
  messages: UIMessage[];
  /** Pre-computed sources to surface as `source-url` parts and persist. */
  sources: AiChatSource[];
};

/**
 * Composes the streaming response for `/api/cxc-ai`. Persists the final
 * assistant turn (alongside the original sources) on stream completion via
 * the AI SDK `onFinish` callback so durability does not depend on the client
 * staying connected. When no model is configured, falls back to an
 * extractive answer derived from `sources`.
 */
export function streamCxcAiTurn({
  chatId,
  messages,
  sources,
}: StreamCxcAiTurnArgs) {
  const latestUserText = getLatestUserText(messages);

  const response = createUIMessageStreamResponse({
    stream: createUIMessageStream({
      async execute({ writer }) {
        sources.forEach((source) => {
          writer.write({
            type: "source-url",
            sourceId: source.id,
            url: source.url,
            title: `${source.label}: ${source.title}`,
            providerMetadata: {
              cxc: {
                snippet: source.snippet,
                kind: source.kind,
              },
            },
          });
        });

        if (!isModelConfigured()) {
          const textId = `fallback-${Date.now().toString(36)}`;
          const text = buildFallbackAnswer(latestUserText, sources);
          writer.write({ type: "text-start", id: textId });
          writer.write({ type: "text-delta", id: textId, delta: text });
          writer.write({ type: "text-end", id: textId });

          const assistantMessage: AiChatMessage = {
            id: textId,
            role: "assistant",
            parts: [
              ...sources.map((source) => ({
                type: "source-url" as const,
                sourceId: source.id,
                url: source.url,
                title: `${source.label}: ${source.title}`,
                snippet: source.snippet,
              })),
              { type: "text" as const, text },
            ],
          };
          await persistFinishedTurn(
            chatId,
            [...messages, assistantMessage],
            sources,
            text,
          );
          return;
        }

        const result = streamText({
          // Chat Completions API on purpose — see model-registry.getModel.
          model: openai.chat(cxcAiModelName),
          system: buildCxcAiSystemPrompt(sources),
          messages: await convertToModelMessages(messages),
          tools: createCxcAiTools({ chatId }),
          stopWhen: cxcAiStopWhen,
          maxOutputTokens: 900,
        });

        writer.merge(
          result.toUIMessageStream({
            originalMessages: messages,
            onFinish: ({ messages: finalMessages }) => {
              const ms = finalMessages as UIMessage[];
              const finalAssistantText = extractFinalAssistantText(ms);
              void persistFinishedTurn(chatId, ms, sources, finalAssistantText);
            },
          }),
        );
      },
    }),
  });

  if (!response.body) {
    return response;
  }
  return new Response(registerStream(chatId, response.body), {
    status: response.status,
    headers: response.headers,
  });
}

function extractFinalAssistantText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message) continue;
    if (message.role === "assistant") {
      return message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part as { text: string }).text ?? "")
        .join("\n");
    }
  }
  return "";
}

async function persistFinishedTurn(
  chatId: string,
  messages: UIMessage[],
  sources: AiChatSource[],
  assistantText: string,
): Promise<void> {
  try {
    const cited = filterCitedSources(sources, assistantText);
    await replaceAiChatMessages(
      chatId,
      messages as unknown as AiChatMessage[],
      cited,
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[cxc-ai] failed to persist assistant turn", error);
    }
  }
}

function filterCitedSources(
  sources: AiChatSource[],
  assistantText: string,
): AiChatSource[] {
  if (!assistantText || sources.length === 0) {
    return sources;
  }
  const indices = citedSourceIndices(assistantText);
  if (indices.size === 0) {
    return sources;
  }
  return sources.filter((_, idx) => indices.has(idx + 1));
}

function toSessionDto(record: AiChatSessionRecord): AiChatSession {
  return {
    id: record.id,
    title: record.title ?? "New CXC AI chat",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    messageCount: record.messages.length,
  };
}

function inferTitle(messages: AiChatMessage[]): string {
  const firstUserText = messages
    .find((message) => message.role === "user")
    ?.parts.map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();

  if (!firstUserText) {
    return "New CXC AI chat";
  }

  return firstUserText.length > 60
    ? `${firstUserText.slice(0, 57)}...`
    : firstUserText;
}

function toPersistedMessageInput(message: AiChatMessage) {
  return {
    uiMessageId: message.id,
    role: message.role,
    content: extractText(message),
    parts: message.parts,
  };
}

function toPersistedSourceInput(source: AiChatSource) {
  return {
    id: source.id,
    kind: source.kind,
    title: source.title,
    url: source.url,
    snippet: source.snippet,
    sourceQuestionId: source.questionId,
    sourceAnswerId: source.answerId,
  };
}

function toMessageDto(
  message: AiChatSessionRecord["messages"][number],
): AiChatMessage {
  const role = message.role.toLowerCase() as AiChatMessage["role"];
  const parts = Array.isArray(message.parts)
    ? (message.parts as AiChatMessage["parts"])
    : textParts(message.content);

  return {
    id: message.uiMessageId ?? message.id,
    role,
    parts,
  };
}

function extractText(message: AiChatMessage): string {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

function textParts(content: string): AiChatMessage["parts"] {
  if (!content) {
    return [];
  }

  return [{ type: "text", text: content }];
}
