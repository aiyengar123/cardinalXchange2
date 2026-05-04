import { QuestionStatus } from "@prisma/client";

import { prisma } from "./client";
import { questionIdentityWhere } from "./questions.queries";
import type { CreateAnswerRecordInput } from "./db.types";

export async function createAnswerRecord(
  questionIdOrSlug: string,
  input: CreateAnswerRecordInput,
) {
  return prisma.$transaction(async (tx) => {
    const question = await tx.question.findFirst({
      where: questionIdentityWhere(questionIdOrSlug),
      select: {
        id: true,
      },
    });

    if (!question) {
      return null;
    }

    const answer = await tx.answer.create({
      data: {
        questionId: question.id,
        body: input.body,
        authorName: input.authorName,
        authorMeta: input.authorMeta,
      },
    });

    await tx.question.update({
      where: {
        id: question.id,
      },
      data: {
        status: QuestionStatus.ANSWERED,
        lastActivityAt: answer.createdAt,
      },
    });

    return answer;
  });
}
