import { prisma } from "./client";
import { searchQuestionRecords } from "./questions.queries";
import { aiChatSessionInclude, type AiChatSessionRecord } from "./db.types";

export async function createAiChatSessionRecord(
  title = "New CXC AI chat",
): Promise<AiChatSessionRecord> {
  return prisma.aiChatSession.create({
    data: {
      title,
    },
    include: aiChatSessionInclude,
  });
}

export async function getAiChatSessionRecord(
  chatId: string,
): Promise<AiChatSessionRecord | null> {
  return prisma.aiChatSession.findUnique({
    where: {
      id: chatId,
    },
    include: aiChatSessionInclude,
  });
}

export async function listAiChatSessionRecords(): Promise<AiChatSessionRecord[]> {
  return prisma.aiChatSession.findMany({
    include: aiChatSessionInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export type InternalContextSourceKind = "question" | "answer";

export type InternalContextRow = {
  kind: InternalContextSourceKind;
  refId: string;
  questionId: string;
  answerId?: string;
  title: string;
  snippet: string;
  url: string;
};

export type SearchInternalContextArgs = {
  limit?: number;
  tags?: string[];
};

/**
 * Source-labeled retrieval over public Questions and Answers only.
 *
 * The CXC AI agent calls this to ground its answers; we deliberately
 * never expose private chat history, drafts, or auth state from this
 * helper. Each row is shaped for the AiChatSource wire DTO.
 */
export async function searchInternalContext(
  query: string,
  options: SearchInternalContextArgs = {},
): Promise<InternalContextRow[]> {
  const { limit = 6, tags = [] } = options;
  const cap = Math.max(1, Math.min(Math.floor(limit), 20));
  const matches = await searchQuestionRecords({
    query,
    tags,
    limit: Math.max(cap, 6),
  });

  const rows: InternalContextRow[] = [];

  for (const question of matches) {
    rows.push({
      kind: "question",
      refId: question.id,
      questionId: question.id,
      title: question.title,
      snippet: snippet(question.body),
      url: `/questions/${question.id}`,
    });

    for (const answer of question.answers) {
      rows.push({
        kind: "answer",
        refId: answer.id,
        questionId: question.id,
        answerId: answer.id,
        title: `Answer on: ${question.title}`,
        snippet: snippet(answer.body),
        url: `/questions/${question.id}#${answer.id}`,
      });
    }

    if (rows.length >= cap) {
      break;
    }
  }

  return rows.slice(0, cap);
}

function snippet(body: string, max = 280): string {
  const compact = body.replace(/\s+/g, " ").trim();
  if (compact.length <= max) {
    return compact;
  }
  return `${compact.slice(0, max - 1)}…`;
}
