import { listAnswerRecords } from "@cardinalxchange/db";

import { getViewer } from "@/lib/viewer";
import type { AnswerDto, CreateAnswerInput } from "@/server/http/contracts";
import { HttpError } from "@/server/http/http";
import { persistAnswer } from "@/server/answers/answers.mutations";
import { toAnswerDto } from "@/server/questions/questions.mappers";

export async function addAnswer(
  questionId: string,
  input: CreateAnswerInput,
): Promise<AnswerDto> {
  const viewer = await getViewer();
  const answer = await persistAnswer(questionId, {
    body: input.body,
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
  };
}

export async function listAnswers(questionId: string): Promise<AnswerDto[]> {
  const answers = await listAnswerRecords(questionId);

  if (!answers) {
    throw new HttpError(404, "question_not_found", "Question not found.");
  }

  return answers.map(toAnswerDto);
}
