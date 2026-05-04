import type { UIMessage } from "ai";

export type TagKind = "topic";
export type QuestionStatus = "open" | "answered";

export type QuestionTagDto = {
  slug: string;
  label: string;
  kind: TagKind;
};

export type TagListItemDto = {
  slug: string;
  label: string;
  questionCount: number;
};

export type QuestionSummaryDto = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  answers: number;
  status: QuestionStatus;
  tags: QuestionTagDto[];
  author: string;
  authorMeta: string;
  askedAt: string;
  activity: string;
};

/**
 * `QuestionRowDto` is the compact feed-row shape. It is the same data
 * `QuestionSummaryDto` already exposes; kept as a named alias so the
 * Frontend Agent and the brief stay aligned on naming.
 */
export type QuestionRowDto = QuestionSummaryDto;

export type AnswerDto = {
  id: string;
  questionId: string;
  body: string;
  author: string;
  authorMeta: string;
  createdAt: string;
};

export type QuestionDetailDto = QuestionSummaryDto & {
  body: string;
  createdAt: string;
  answersList: AnswerDto[];
};

export type CreateQuestionInput = {
  title: string;
  body: string;
  tags: string[];
  authorDisplayName?: string;
  authorMeta?: string;
};

export type CreateAnswerInput = {
  body: string;
  authorDisplayName?: string;
  authorMeta?: string;
};

export type AiChatSourceKind = "question" | "answer" | "web";

export type AiChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type AiChatMessage = UIMessage;

export type AiChatSource = {
  id: string;
  kind: AiChatSourceKind;
  label: string;
  title: string;
  snippet: string;
  questionId: string;
  answerId?: string;
  url: string;
};

export type AskCommunityDraft = {
  title: string;
  body: string;
  tags: string[];
};

export type AiChatSnapshot = {
  session: AiChatSession;
  messages: AiChatMessage[];
};

/**
 * Brief-named aliases. Frontend Agent should prefer these names to stay
 * aligned with `docs/build/02-backend.md`.
 */
export type CxcMessageDto = AiChatMessage;
export type CxcSourceDto = AiChatSource;
