import { prisma } from "./client";
import { answerInclude } from "./db.types";
import { questionIdentityWhere } from "./questions.queries";

export async function listAnswerRecords(questionIdOrSlug: string) {
  const question = await prisma.question.findFirst({
    where: questionIdentityWhere(questionIdOrSlug),
    select: { id: true },
  });

  if (!question) {
    return null;
  }

  return prisma.answer.findMany({
    where: { questionId: question.id },
    include: answerInclude,
    orderBy: { createdAt: "asc" },
  });
}
