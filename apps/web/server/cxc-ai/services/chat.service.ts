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
} from "@/server/cxc-ai/agents/cxc.agent";
import type {
  AiChatMessage,
  AiChatSource,
  AiChatSession,
  AiChatSnapshot,
} from "@/server/http/contracts";

export async function createAiChatSession(title = "New CXC AI chat"): Promise<AiChatSession> {
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

export async function getAiChatSnapshot(chatId: string): Promise<AiChatSnapshot> {
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
export function streamCxcAiTurn({ chatId, messages, sources }: StreamCxcAiTurnArgs) {
  const latestUserText = getLatestUserText(messages);

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

        if (!isModelConfigured()) {
          const textId = `fallback-${Date.now().toString(36)}`;
          const text = buildFallbackAnswer(latestUserText, sources);
          writer.write({ type: "text-start", id: textId });
          writer.write({ type: "text-delta", id: textId, delta: text });
          writer.write({ type: "text-end", id: textId });

          // Persist the user-side turn + the synthesized assistant text so a
          // refresh resumes the conversation. The fallback path has no
          // streaming model so we can write here synchronously.
          const assistantMessage: AiChatMessage = {
            id: textId,
            role: "assistant",
            parts: [{ type: "text", text }],
          };
          await persistFinishedTurn(chatId, [...messages, assistantMessage], sources);
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

        // Wire the AI SDK's UI message stream and persist the finished
        // assistant turn server-side. `onFinish` runs even if the client
        // disconnects mid-stream, so durability does not depend on the tab
        // staying open.
        writer.merge(
          result.toUIMessageStream({
            originalMessages: messages,
            onFinish: ({ messages: finalMessages }) => {
              void persistFinishedTurn(
                chatId,
                finalMessages as UIMessage[],
                sources,
              );
            },
          }),
        );
      },
    }),
  });
}

async function persistFinishedTurn(
  chatId: string,
  messages: UIMessage[],
  sources: AiChatSource[],
): Promise<void> {
  try {
    await replaceAiChatMessages(
      chatId,
      messages as unknown as AiChatMessage[],
      sources,
    );
  } catch (error) {
    // We never want a persistence failure to crash the streaming response.
    // Surface to the dev console so the issue is debuggable; production
    // observability is a downstream concern.
    if (process.env.NODE_ENV !== "production") {
      console.error("[cxc-ai] failed to persist assistant turn", error);
    }
  }
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

  return firstUserText.length > 60 ? `${firstUserText.slice(0, 57)}...` : firstUserText;
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
