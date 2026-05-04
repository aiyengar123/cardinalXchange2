import { Prisma } from "@prisma/client";

import { prisma } from "./client";
import {
  normalizeTagLabels,
  slugify,
} from "./questions.queries";
import {
  questionInclude,
  type CreateQuestionRecordInput,
  type QuestionRecord,
} from "./db.types";

export async function createQuestionRecord(
  input: CreateQuestionRecordInput,
): Promise<QuestionRecord> {
  return prisma.$transaction(async (tx) => {
    const tags = await upsertTags(tx, input.tags);
    const question = await tx.question.create({
      data: {
        slug: await uniqueQuestionSlug(tx, input.title),
        title: input.title,
        body: input.body,
        authorName: input.authorName,
        authorMeta: input.authorMeta,
        searchText: buildSearchText(
          input.title,
          input.body,
          tags.map((tag) => tag.label),
        ),
      },
    });

    if (tags.length > 0) {
      await tx.questionTag.createMany({
        data: tags.map((tag) => ({
          questionId: question.id,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });
    }

    const created = await tx.question.findUnique({
      where: {
        id: question.id,
      },
      include: questionInclude,
    });

    if (!created) {
      throw new Error("Question was not found after create.");
    }

    return created;
  });
}

async function upsertTags(tx: Prisma.TransactionClient, labels: string[]) {
  const tags = normalizeTagLabels(labels);

  return Promise.all(
    tags.map((tag) =>
      tx.tag.upsert({
        where: {
          slug: tag.slug,
        },
        update: {
          label: tag.label,
        },
        create: tag,
      }),
    ),
  );
}

async function uniqueQuestionSlug(
  tx: Prisma.TransactionClient,
  title: string,
): Promise<string> {
  const baseSlug = slugify(title) || "question";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${shortId()}`;
    const existing = await tx.question.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

function buildSearchText(title: string, body: string, tags: string[]): string {
  return [title, body, ...tags].join(" ").toLowerCase();
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}
