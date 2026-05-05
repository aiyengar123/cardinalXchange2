import { prisma } from "./client";

export type UserProfileRecord = {
  id: string;
  name: string;
  displayName: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
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
  questions: Array<{
    id: string;
    slug: string;
    title: string;
    createdAt: Date;
    answerCount: number;
  }>;
  answers: Array<{
    id: string;
    questionId: string;
    questionSlug: string;
    questionTitle: string;
    body: string;
    createdAt: Date;
  }>;
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
