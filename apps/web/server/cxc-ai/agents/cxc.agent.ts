import { stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import type { AiChatSource, AskCommunityDraft } from "@/server/http/contracts";
import {
  askCommunityToolDescription,
  askCommunityToolName,
  buildSystemPrompt,
  formatSourcesForPrompt,
} from "@/server/cxc-ai/agents/prompts";
import { retrievePublicQuestionAnswerSources } from "@/server/cxc-ai/services/retrieval.service";

export const cxcAiModelName = process.env.OPENAI_MODEL ?? "gpt-5-mini";
export const cxcAiMaxDuration = 30;
export const cxcAiStopWhen = stepCountIs(3);

export function buildCxcAiSystemPrompt(sources: AiChatSource[]): string {
  return buildSystemPrompt(sources);
}

export function createCxcAiTools() {
  return {
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
    return [
      "I do not have enough public CardinalXchange question or answer context to answer this confidently.",
      userText ? `Question: ${userText}` : "",
      "Use Ask the Community to collect student experience before relying on an answer.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const sourceLines = sources
    .slice(0, 4)
    .map((source) => `[${source.label}: ${source.title}] ${source.snippet}`)
    .join("\n\n");

  return [
    "I found related public CardinalXchange context, but no model provider is configured, so this is an extractive draft.",
    sourceLines,
    "Treat these sources as starting points. Ask the Community if you need current student-specific experience.",
  ].join("\n\n");
}

export { formatSourcesForPrompt };
