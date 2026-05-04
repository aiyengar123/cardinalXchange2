import type { QuestionRecord } from "@cardinalxchange/db";

import { getViewer } from "@/lib/viewer";
import type {
  AnswerDto,
  CreateQuestionInput,
  QuestionDetailDto,
  QuestionStatus,
  QuestionSummaryDto,
  QuestionTagDto,
} from "@/server/http/contracts";
import { HttpError } from "@/server/http/http";
import {
  findQuestionByIdentity,
  findQuestionsForFeed,
} from "@/server/questions/questions.queries";
import { persistQuestion } from "@/server/questions/questions.mutations";
import type { ListQuestionsForFeedArgs } from "@/server/questions/questions.types";

export async function listQuestionsForFeed(
  args: ListQuestionsForFeedArgs = {},
): Promise<QuestionSummaryDto[]> {
  const records = await findQuestionsForFeed(args);
  return records.map(toSummaryDto);
}

/**
 * @deprecated Prefer `listQuestionsForFeed`. Kept temporarily so existing
 * server-component callers keep building during the Wave 2 transition.
 */
export async function listQuestions(): Promise<QuestionSummaryDto[]> {
  return listQuestionsForFeed();
}

export async function getQuestionDetail(
  questionId: string,
): Promise<QuestionDetailDto> {
  const question = await findQuestionByIdentity(questionId);

  if (!question) {
    throw new HttpError(404, "question_not_found", "Question not found.");
  }

  return toDetailDto(question);
}

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<QuestionDetailDto> {
  const viewer = await getViewer();
  const question = await persistQuestion({
    title: input.title,
    body: input.body,
    tags: input.tags,
    authorName: input.authorDisplayName ?? viewer.displayName,
    authorMeta: input.authorMeta ?? viewer.meta,
  });

  return getQuestionDetail(question.id);
}

export function toDetailDto(question: QuestionRecord): QuestionDetailDto {
  return {
    ...toSummaryDto(question),
    body: question.body,
    createdAt: question.createdAt.toISOString(),
    answersList: question.answers.map(toAnswerDto),
  };
}

export function toSummaryDto(question: QuestionRecord): QuestionSummaryDto {
  const latestAnswer = question.answers[0];

  return {
    id: question.id,
    slug: question.slug,
    title: question.title,
    excerpt:
      question.body.length > 170
        ? `${question.body.slice(0, 167)}...`
        : question.body,
    answers: question.answers.length,
    status: toQuestionStatus(question.status),
    tags: question.tags.map(toTagDto),
    author: question.authorName,
    authorMeta: question.authorMeta ?? "",
    askedAt: relativeTime(question.createdAt),
    activity: latestAnswer
      ? `new answer ${relativeTime(latestAnswer.createdAt)}`
      : "needs first answer",
  };
}

export function toAnswerDto(
  answer: QuestionRecord["answers"][number],
): AnswerDto {
  return {
    id: answer.id,
    questionId: answer.questionId,
    body: answer.body,
    author: answer.authorName,
    authorMeta: answer.authorMeta ?? "",
    createdAt: answer.createdAt.toISOString(),
  };
}

function toTagDto(questionTag: QuestionRecord["tags"][number]): QuestionTagDto {
  return {
    slug: questionTag.tag.slug,
    label: questionTag.tag.label,
    kind: "topic",
  };
}

function toQuestionStatus(status: QuestionRecord["status"]): QuestionStatus {
  return status.toLowerCase() as QuestionStatus;
}

function relativeTime(date: Date): string {
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}
