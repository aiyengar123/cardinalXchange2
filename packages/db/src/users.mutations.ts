import { prisma } from "./client";

export async function updateUserDisplayName(
  userId: string,
  displayName: string | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { displayName },
  });

  const authorName = displayName?.trim() || null;
  if (authorName) {
    await prisma.question.updateMany({
      where: { authorId: userId },
      data: { authorName },
    });
    await prisma.answer.updateMany({
      where: { authorId: userId },
      data: { authorName },
    });
  }
}

/**
 * Soft-delete the user: stamps `deletedAt`, scrubs PII-ish fields, and
 * keeps their authored questions/answers in place for thread continuity
 * (`onDelete: SetNull` on the FK already nulls authorId on hard-delete;
 * for soft-delete we leave the FK intact but the profile route filters
 * on `deletedAt: null`).
 */
export async function softDeleteUser(userId: string): Promise<void> {
  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: now,
      name: "Deleted user",
      displayName: null,
      email: `deleted-${userId}@deleted.local`,
      image: null,
    },
  });
  await prisma.session.deleteMany({ where: { userId } });
}
