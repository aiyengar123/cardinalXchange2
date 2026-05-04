import {
  AiChatRole,
  AiChatSourceKind,
  Prisma,
} from "@prisma/client";

import { prisma } from "./client";
import {
  aiChatSessionInclude,
  type AiChatSessionRecord,
  type PersistedAiChatMessageInput,
  type PersistedAiChatSourceInput,
} from "./db.types";

export async function ensureAiChatSessionRecord(
  chatId: string,
  title = "New CXC AI chat",
): Promise<AiChatSessionRecord> {
  return prisma.aiChatSession.upsert({
    where: {
      id: chatId,
    },
    update: {
      title,
    },
    create: {
      id: chatId,
      title,
    },
    include: aiChatSessionInclude,
  });
}

export async function replaceAiChatSessionMessages(
  chatId: string,
  title: string,
  messages: PersistedAiChatMessageInput[],
  sources?: PersistedAiChatSourceInput[],
): Promise<AiChatSessionRecord> {
  return prisma.$transaction(async (tx) => {
    await tx.aiChatSession.upsert({
      where: {
        id: chatId,
      },
      update: {
        title,
      },
      create: {
        id: chatId,
        title,
      },
    });

    await tx.aiChatMessage.deleteMany({
      where: {
        sessionId: chatId,
      },
    });

    for (const message of messages) {
      await tx.aiChatMessage.create({
        data: {
          sessionId: chatId,
          role: toAiChatRole(message.role),
          uiMessageId: message.uiMessageId,
          content: message.content,
          parts: toJsonInput(message.parts),
          model: message.model,
          confidence: message.confidence,
        },
      });
    }

    if (sources) {
      await tx.aiChatSource.deleteMany({
        where: {
          sessionId: chatId,
        },
      });

      for (const source of sources) {
        await tx.aiChatSource.create({
          data: {
            sessionId: chatId,
            kind: toAiChatSourceKind(source.kind),
            title: source.title,
            url: source.url,
            snippet: source.snippet,
            sourceQuestionId: source.sourceQuestionId,
            sourceAnswerId: source.sourceAnswerId,
          },
        });
      }
    }

    return tx.aiChatSession.update({
      where: {
        id: chatId,
      },
      data: {
        updatedAt: new Date(),
      },
      include: aiChatSessionInclude,
    });
  });
}

function toAiChatRole(role: PersistedAiChatMessageInput["role"]): AiChatRole {
  switch (role) {
    case "assistant":
      return AiChatRole.ASSISTANT;
    case "system":
      return AiChatRole.SYSTEM;
    case "user":
    default:
      return AiChatRole.USER;
  }
}

function toAiChatSourceKind(
  kind: PersistedAiChatSourceInput["kind"],
): AiChatSourceKind {
  switch (kind) {
    case "answer":
      return AiChatSourceKind.INTERNAL_ANSWER;
    case "web":
      return AiChatSourceKind.WEB;
    case "question":
    default:
      return AiChatSourceKind.INTERNAL_QUESTION;
  }
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
