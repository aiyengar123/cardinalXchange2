import {
  getQuestionRecord,
  listQuestionRecords,
  type ListQuestionRecordsArgs,
  type QuestionFeedRecord,
  type QuestionRecord,
} from "@cardinalxchange/db";

import type { ListQuestionsForFeedArgs } from "@/server/questions/questions.types";

/**
 * Thin wrappers around `@cardinalxchange/db` query helpers. Services in this
 * package call these instead of importing Prisma helpers directly so the
 * service layer stays declarative and testable.
 */

export async function findQuestionsForFeed(
  args: ListQuestionsForFeedArgs = {},
): Promise<QuestionFeedRecord[]> {
  const queryArgs: ListQuestionRecordsArgs = {
    tag: args.tag,
    sort: args.sort ?? "active",
  };

  return listQuestionRecords(queryArgs);
}

export async function findQuestionByIdentity(
  questionIdOrSlug: string,
): Promise<QuestionRecord | null> {
  return getQuestionRecord(questionIdOrSlug);
}
