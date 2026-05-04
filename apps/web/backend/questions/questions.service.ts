import { getViewer } from "@/backend/viewer";
import type {
  CreateQuestionInput,
  QuestionDetailDto,
  QuestionSummaryDto,
} from "@/backend/http/contracts";
import { HttpError } from "@/backend/http/http";
import {
  toDetailDto,
  toSummaryDto,
} from "@/backend/questions/questions.mappers";
import {
  findQuestionByIdentity,
  findQuestionsForFeed,
} from "@/backend/questions/questions.queries";
import { persistQuestion } from "@/backend/questions/questions.mutations";
import type { ListQuestionsForFeedArgs } from "@/backend/questions/questions.types";

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
