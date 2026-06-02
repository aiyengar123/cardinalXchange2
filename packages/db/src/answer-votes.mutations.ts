import { prisma } from "./client";

export async function upsertAnswerVote(
  answerId: string,
  userId: string,
  value: 1 | -1 | 0,
): Promise<void> {
  if (value === 0) {
    await prisma.answerVote.deleteMany({ where: { answerId, userId } });
    return;
  }
  await prisma.answerVote.upsert({
    where: { answerId_userId: { answerId, userId } },
    create: { answerId, userId, value },
    update: { value },
  });
}
