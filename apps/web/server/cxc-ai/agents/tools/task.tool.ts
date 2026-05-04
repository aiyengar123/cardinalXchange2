import {
  convertToModelMessages,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { getModel } from "@/server/cxc-ai/agents/model-registry";
import {
  createResearchSubagentTools,
  researchSubagentStopWhen,
  researchSubagentSystemPrompt,
} from "@/server/cxc-ai/agents/research-subagent.agent";
import {
  ensureAiChatSession,
  replaceAiChatMessages,
} from "@/server/cxc-ai/services/chat.service";
import type { AiChatMessage } from "@/server/http/contracts";

/**
 * Derives the persistence id used to store a sub-agent run as its own thread.
 *
 * Exported (rather than inlined) so the frontend — which will eventually link
 * the parent thread to the spawned sub-thread — can derive the same id from
 * the same `toolCallId` without re-implementing the convention.
 */
export function deriveSubagentThreadId(toolCallId: string): string {
  return `subagent-${toolCallId}`;
}

type CreateTaskToolArgs = {
  parentChatId: string;
};

const taskToolInputSchema = z.object({
  topic: z.string().min(1).max(240),
  background: z.string().min(1).max(800),
});

type TaskToolInput = z.infer<typeof taskToolInputSchema>;

type TaskToolOutput = {
  subThreadId: string;
  synthesis: string;
  error?: string;
};

/**
 * Builds the `Task` tool the main agent calls to delegate a focused research
 * run to a sub-agent. The sub-agent's full transcript is persisted under a
 * derived sub-thread id so the parent run stays clean while the sub-agent's
 * work remains durable and auditable.
 */
export function createTaskTool(_options: CreateTaskToolArgs) {
  return tool({
    description:
      "Spawn a focused research sub-agent on a narrower Stanford topic. Use when the user's question has 2+ independent facets that benefit from parallel investigation. Returns a synthesis the main agent should weave into its final answer.",
    inputSchema: taskToolInputSchema,
    execute: async (
      { topic, background }: TaskToolInput,
      { toolCallId },
    ): Promise<TaskToolOutput> => {
      const subThreadId = deriveSubagentThreadId(
        toolCallId ?? crypto.randomUUID(),
      );

      try {
        await ensureAiChatSession(subThreadId, []);

        const userMessages: UIMessage[] = [
          {
            id: "u1",
            role: "user",
            parts: [
              {
                type: "text",
                text: `${topic}\n\nBackground: ${background}`,
              },
            ],
          },
        ];

        const result = streamText({
          model: getModel("research-subagent"),
          system: researchSubagentSystemPrompt,
          messages: await convertToModelMessages(userMessages),
          tools: createResearchSubagentTools(),
          stopWhen: researchSubagentStopWhen,
          maxOutputTokens: 600,
        });

        const finalText = await result.text;

        const assistantMessage: AiChatMessage = {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", text: finalText }],
        };

        await replaceAiChatMessages(subThreadId, [
          ...(userMessages as AiChatMessage[]),
          assistantMessage,
        ]);

        return {
          subThreadId,
          synthesis: finalText.slice(0, 4000),
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          subThreadId,
          synthesis: "",
          error: message,
        };
      }
    },
  });
}
