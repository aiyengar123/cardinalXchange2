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
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  },
  "research-subagent": {
    provider: "openai",
    model:
      process.env.OPENAI_RESEARCH_MODEL ??
      process.env.OPENAI_MODEL ??
      "gpt-5-mini",
  },
  title: {
    provider: "openai",
    model: "gpt-5-mini",
  },
};

export function getModel(name: LogicalModelName): LanguageModel {
  const entry = registry[name];
  switch (entry.provider) {
    case "openai":
      return openai(entry.model);
    default: {
      const provider: never = entry.provider;
      throw new Error(`Unknown provider: ${String(provider)}`);
    }
  }
}

export function getModelName(name: LogicalModelName): string {
  return registry[name].model;
}
