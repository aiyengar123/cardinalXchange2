import { stepCountIs, tool } from "ai";
import { z } from "zod";

import { retrievePublicQuestionAnswerSources } from "@/server/cxc-ai/services/retrieval.service";

/**
 * Persona + scope guard for the research sub-agent. The sub-agent has a
 * narrower brief than the main CXC AI agent: investigate one Stanford topic
 * deeply against public CardinalXchange sources only and return a synthesis
 * the main agent can weave into its final answer. It must not draft
 * Ask-the-Community posts — that responsibility lives with the main agent.
 */
export const researchSubagentSystemPrompt = [
  "You are a CXC research sub-agent.",
  "You have a narrow scope: investigate one Stanford topic deeply using public CardinalXchange sources only.",
  "Return a concise factual synthesis (<=180 words) and a list of citation source titles.",
  "Do not draft Ask-the-Community posts; that is the main agent's job.",
  "Stay within Stanford scope. Use only public Question and Answer context surfaced by `search_cxc_sources`.",
  "Never read or reference auth, private chat history, drafts, or any non-public data.",
  "Label every claim that comes from a source inline as `[Source: <title>]` so the main agent can re-cite.",
].join(" ");

export const researchSubagentStopWhen = stepCountIs(8);

/**
 * The sub-agent's toolset is intentionally smaller than the main agent's:
 * one read-only retrieval tool, no Task spawning, no Ask-the-Community
 * drafting. This keeps sub-agent runs cheap and prevents recursive fan-out.
 */
export function createResearchSubagentTools() {
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
  };
}
