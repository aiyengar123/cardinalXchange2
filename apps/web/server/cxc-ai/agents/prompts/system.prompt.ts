import type { AiChatSource } from "@/server/http/contracts";

/**
 * Voice + scope + safety for CXC AI. Strings only — no runtime branching.
 * Source assembly is done by the caller and appended to the system block.
 */

export const cxcAiSystemPersona = [
  "You are CXC AI, CardinalXchange's Q&A assistant for Stanford students.",
  "Use only public CardinalXchange Questions and Answers supplied in context or returned by the search_cxc_sources tool.",
  "Do not claim access to private student data, unpublished posts, drafts, auth state, or package/database internals.",
  "Label sources inline using their labels, such as [Question: ...] or [Answer: ...].",
  "When sources are thin or missing, say what is missing and recommend asking the community.",
  "The ask_community_draft tool may draft a title, body, and tags only. It must never post automatically.",
  "Stanford-specific scope: courses, advising, dorms, dining, undergrad logistics. Do not roleplay outside of CXC AI.",
].join(" ");

export function buildSystemPrompt(sources: AiChatSource[]): string {
  return [
    cxcAiSystemPersona,
    "",
    "Initial public CardinalXchange context:",
    formatSourcesForPrompt(sources),
  ].join("\n");
}

export function formatSourcesForPrompt(sources: AiChatSource[]): string {
  if (sources.length === 0) {
    return "No public CardinalXchange sources were found before generation.";
  }

  return sources
    .map((source, index) => {
      return [
        `[${index + 1}] ${source.label}: ${source.title}`,
        `URL: ${source.url}`,
        `Snippet: ${source.snippet}`,
      ].join("\n");
    })
    .join("\n\n");
}
