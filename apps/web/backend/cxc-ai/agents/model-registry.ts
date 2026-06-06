// Logical model registry. Swap providers without touching call sites.
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type LogicalModelName = "chat-agent" | "research-subagent" | "title";

type ProviderName = "openai";

type RegistryEntry = {
  provider: ProviderName;
  model: string;
};

/**
 * Single source of truth mapping logical model names to concrete
 * provider+model pairs. Today every entry resolves to OpenAI; adding a new
 * provider should be a one-line change here plus a new branch in `getModel`.
 */
const registry: Record<LogicalModelName, RegistryEntry> = {
  "chat-agent": {
    provider: "openai",
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  },
  "research-subagent": {
    provider: "openai",
    model:
      process.env.OPENAI_RESEARCH_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-4.1-mini",
  },
  title: {
    provider: "openai",
    model: "gpt-4.1-mini",
  },
};

export function getModel(name: LogicalModelName): LanguageModel {
  const entry = registry[name];
  switch (entry.provider) {
    case "openai":
      // `openai.chat()` pins the Chat Completions API. The provider default
      // (`openai()`) routes through the newer Responses API, which
      // endpoint-restricted project keys reject with `invalid_api_key`.
      return openai.chat(entry.model);
    default: {
      const provider: never = entry.provider;
      throw new Error(`Unknown provider: ${String(provider)}`);
    }
  }
}

export function getModelName(name: LogicalModelName): string {
  return registry[name].model;
}
