import { Prisma } from "@prisma/client";

export const questionInclude = {
  tags: {
    include: {
      tag: true,
    },
    orderBy: {
      tag: {
        label: "asc",
      },
    },
  },
  answers: {
    orderBy: {
      createdAt: "asc",
    },
  },
  _count: {
    select: {
      answers: true,
    },
  },
} satisfies Prisma.QuestionInclude;

export type QuestionRecord = Prisma.QuestionGetPayload<{
  include: typeof questionInclude;
}>;

/**
 * Lightweight feed include — answers are capped at 1 (most recent) so the
 * feed can compute "new answer N min ago" activity without pulling every
 * answer body. Use `questionInclude` (full asc-ordered list) for the detail
 * page.
 */
export const questionFeedInclude = {
  tags: {
    include: {
      tag: true,
    },
    orderBy: {
      tag: {
        label: "asc",
      },
    },
  },
  answers: {
    orderBy: {
      createdAt: "desc",
    },
    take: 1,
  },
  _count: {
    select: {
      answers: true,
    },
  },
} satisfies Prisma.QuestionInclude;

export type QuestionFeedRecord = Prisma.QuestionGetPayload<{
  include: typeof questionFeedInclude;
}>;

export const aiChatSessionInclude = {
  messages: {
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.AiChatSessionInclude;

export type AiChatSessionRecord = Prisma.AiChatSessionGetPayload<{
  include: typeof aiChatSessionInclude;
}>;

export type CreateQuestionRecordInput = {
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  authorMeta?: string | null;
};

export type CreateAnswerRecordInput = {
  body: string;
  authorName: string;
  authorMeta?: string | null;
};

export type AiChatSourceInput = {
  id?: string;
  kind: "internal" | "web";
  title: string;
  url?: string;
  snippet: string;
};

export type PersistedAiChatMessageInput = {
  uiMessageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts: unknown;
  model?: string | null;
  confidence?: number | null;
};

export type PersistedAiChatSourceInput = {
  id: string;
  kind: "question" | "answer" | "web";
  title: string;
  url?: string | null;
  snippet: string;
  sourceQuestionId?: string | null;
  sourceAnswerId?: string | null;
};
