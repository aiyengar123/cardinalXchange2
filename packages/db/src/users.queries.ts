import type { Answer, Question, User } from "@prisma/client";

import { prisma } from "./client";

export async function getUserDisplayName(
  userId: string,
): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { displayName: true, name: true },
  });
  if (!user) return null;
  return user.displayName?.trim() || user.name;
}

export type UserProfileRecord = Pick<
  User,
  "id" | "name" | "displayName" | "email" | "image" | "createdAt"
> & {
  questionCount: number;
  answerCount: number;
};

export async function getUserProfileRecord(
  userId: string,
): Promise<UserProfileRecord | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      name: true,
      displayName: true,
      email: true,
      image: true,
      createdAt: true,
      _count: { select: { questions: true, answers: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    questionCount: user._count.questions,
    answerCount: user._count.answers,
  };
}

export type UserActivityRecord = {
  questions: Array<
    Pick<Question, "id" | "slug" | "title" | "createdAt"> & {
      answerCount: number;
    }
  >;
  answers: Array<
    Pick<Answer, "id" | "questionId" | "body" | "createdAt"> & {
      questionSlug: string;
      questionTitle: string;
    }
  >;
};

export async function getUserActivityRecord(
  userId: string,
  take = 20,
): Promise<UserActivityRecord> {
  const [questions, answers] = await Promise.all([
    prisma.question.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
        _count: { select: { answers: true } },
      },
    }),
    prisma.answer.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        questionId: true,
        body: true,
        createdAt: true,
        question: { select: { slug: true, title: true } },
      },
    }),
  ]);

  return {
    questions: questions.map((q) => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      createdAt: q.createdAt,
      answerCount: q._count.answers,
    })),
    answers: answers.map((a) => ({
      id: a.id,
      questionId: a.questionId,
      questionSlug: a.question.slug,
      questionTitle: a.question.title,
      body: a.body,
      createdAt: a.createdAt,
    })),
  };
}
