/**
 * Tool description + sketch for the `ask_community_draft` tool. The tool's
 * runtime contract (input shape, output shape) is wired in `cxc.agent.ts`.
 * This file holds only the strings the model sees.
 */

export const askCommunityToolName = "ask_community_draft" as const;

export const askCommunityToolDescription = [
  "Draft a transient Ask the Community post.",
  "Returns a title, body, and tags only. It never writes to the database",
  "and never posts to the public forum. The user must explicitly click",
  "Post Question on the public form to publish.",
].join(" ");

export const askCommunityGuidance = [
  "When public Q&A context is too thin to answer with confidence, propose",
  "an Ask the Community draft. Aim for a clear title (one sentence), a body",
  "that captures what the asker has tried, and 1-3 tag labels that match",
  "existing CardinalXchange topics if you can infer them.",
].join(" ");
