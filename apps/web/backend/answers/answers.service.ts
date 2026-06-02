import { listAnswerRecords, upsertAnswerVote } from "@cardinalxchange/db";

import { getViewer } from "@/backend/viewer";
import type { AnswerDto, CreateAnswerInput } from "@/backend/http/contracts";
import { HttpError } from "@/backend/http/http";
import { persistAnswer } from "@/backend/answers/answers.mutations";
import { toAnswerDto } from "@/backend/questions/questions.mappers";

export async function addAnswer(
  questionId: string,
  input: CreateAnswerInput,
): Promise<AnswerDto> {
  const viewer = await getViewer();
  if (!viewer.isAuthenticated) {
    throw new HttpError(401, "auth_required", "Sign in to post an answer.");
  }

  const answer = await persistAnswer(questionId, {
    body: input.body,
    authorId: viewer.id,
    authorName: input.authorDisplayName ?? viewer.displayName,
    authorMeta: input.authorMeta ?? viewer.meta,
  });

  if (!answer) {
    throw new HttpError(404, "question_not_found", "Question not found.");
  }

  return {
    id: answer.id,
    questionId: answer.questionId,
    body: answer.body,
    author: answer.authorName,
    authorMeta: answer.authorMeta ?? "",
    createdAt: answer.createdAt.toISOString(),
    voteScore: 0,
    viewerVote: 0,
  };
}

export async function listAnswers(questionId: string): Promise<AnswerDto[]> {
  const [answers, viewer] = await Promise.all([
    listAnswerRecords(questionId),
    getViewer(),
  ]);

  if (!answers) {
    throw new HttpError(404, "question_not_found", "Question not found.");
  }

  const viewerId = viewer.isAuthenticated ? viewer.id : undefined;
  return answers
    .map((a) => toAnswerDto(a, viewerId))
    .sort((a, b) => b.voteScore - a.voteScore);
}

export async function voteAnswer(
  answerId: string,
  value: 1 | -1 | 0,
): Promise<void> {
  const viewer = await getViewer();
  if (!viewer.isAuthenticated) {
    throw new HttpError(401, "auth_required", "Sign in to vote.");
  }
  await upsertAnswerVote(answerId, viewer.id, value);
}
