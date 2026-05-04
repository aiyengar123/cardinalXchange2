import { stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import type { AiChatSource, AskCommunityDraft } from "@/server/http/contracts";
import { getModelName } from "@/server/cxc-ai/agents/model-registry";
import {
  askCommunityToolDescription,
  askCommunityToolName,
  buildSystemPrompt,
  formatSourcesForPrompt,
} from "@/server/cxc-ai/agents/prompts";
import { createTaskTool } from "@/server/cxc-ai/agents/tools/task.tool";
import { retrievePublicQuestionAnswerSources } from "@/server/cxc-ai/services/retrieval.service";

export const cxcAiModelName = getModelName("chat-agent");
export const cxcAiMaxDuration = 30;
export const cxcAiStopWhen = stepCountIs(15);

export function buildCxcAiSystemPrompt(sources: AiChatSource[]): string {
  return buildSystemPrompt(sources);
}

export function createCxcAiTools(options: { chatId?: string } = {}) {
  const baseTools = {
    search_cxc_sources: tool({
      description:
        "Search read-only public CardinalXchange Questions and Answers for source-backed context.",
      inputSchema: z.object({
        query: z.string().min(1).max(240),
        tags: z.array(z.string().min(1).max(64)).max(8).optional(),
      }),
      execute: async ({ query, tags }) => ({
        sources: await retrievePublicQuestionAnswerSources({
          query,
          tags,
          limit: 6,
        }),
      }),
    }),
    [askCommunityToolName]: tool({
      description: askCommunityToolDescription,
      inputSchema: z.object({
        title: z.string().min(1).max(180),
        body: z.string().min(1).max(2000),
        tags: z.array(z.string().min(1).max(64)).min(1).max(8),
      }),
      execute: async (draft): Promise<AskCommunityDraft> => ({
        title: draft.title,
        body: draft.body,
        tags: draft.tags,
      }),
    }),
  };

  if (options.chatId) {
    const taskTool = createTaskTool({ parentChatId: options.chatId });
    return { ...baseTools, Task: taskTool };
  }

  return baseTools;
}

export function getLatestUserText(messages: UIMessage[]): string {
  return (
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.parts.map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim() ?? ""
  );
}

export function buildFallbackAnswer(
  userText: string,
  sources: AiChatSource[],
): string {
  if (sources.length === 0) {
    if (isTrivialQuery(userText)) {
      return "Hi — CXC AI is not connected to a model provider right now, so I can't answer freely. Try asking a specific Stanford question (housing, courses, advising, dining), and I'll surface relevant public CardinalXchange threads.";
    }
    return "I couldn't find any public CardinalXchange threads for that, and I'm not connected to a model provider right now. Try Ask the Community to start a fresh thread.";
  }

  return "I'm not connected to a model provider right now, so I can't synthesize a custom answer. Here are the public CardinalXchange threads that look most relevant — they may have what you need.";
}

function isTrivialQuery(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  if (trimmed.length < 4) return true;
  const greetings = new Set([
    "hi",
    "hey",
    "hello",
    "yo",
    "sup",
    "test",
    "ping",
    "thanks",
    "thank you",
    "ok",
    "okay",
  ]);
  return greetings.has(trimmed);
}

export { isTrivialQuery };

export { formatSourcesForPrompt };
