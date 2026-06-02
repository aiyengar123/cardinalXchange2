import { Prisma } from "@prisma/client";

import { prisma } from "./client";
import {
  questionFeedInclude,
  questionInclude,
  type QuestionFeedRecord,
  type QuestionRecord,
} from "./db.types";

export type ListQuestionRecordsArgs = {
  tag?: string;
  sort?: "newest" | "active" | "unanswered" | "answered";
  take?: number;
};

export const DEFAULT_FEED_TAKE = 50;

export async function listQuestionRecords(
  args: ListQuestionRecordsArgs = {},
): Promise<QuestionFeedRecord[]> {
  const { tag, sort = "active", take = DEFAULT_FEED_TAKE } = args;
  const where: Prisma.QuestionWhereInput = {};

  if (tag && tag.trim().length > 0) {
    where.tags = {
      some: {
        tag: {
          slug: tag.trim().toLowerCase(),
        },
      },
    };
  }

  if (sort === "unanswered") {
    where.answers = { none: {} };
  }

  if (sort === "answered") {
    where.answers = { some: {} };
  }

  const orderBy: Prisma.QuestionOrderByWithRelationInput =
    sort === "newest" ? { createdAt: "desc" } : { lastActivityAt: "desc" };

  return prisma.question.findMany({
    where,
    include: questionFeedInclude,
    orderBy,
    take,
  });
}

export async function getQuestionRecord(
  questionIdOrSlug: string,
): Promise<QuestionRecord | null> {
  return prisma.question.findFirst({
    where: questionIdentityWhere(questionIdOrSlug),
    include: questionInclude,
  });
}

export type SearchQuestionRecordsArgs = {
  query: string;
  tags?: string[];
  limit?: number;
};

/**
 * Postgres-backed search over Question + Answer text. Ranking is two-pass:
 *   1. Pull a candidate set via case-insensitive `contains` across title,
 *      body, searchText, answer body, and tag label.
 *   2. Score each candidate so title and tag matches outrank body-only
 *      matches, with a small boost when the question has any answers.
 *
 * The tag filter is exclusive: passing `tags` restricts the candidate set
 * to questions that carry one of the supplied tag slugs.
 */
export async function searchQuestionRecords(
  args: string | SearchQuestionRecordsArgs,
  legacyTags: string[] = [],
): Promise<QuestionRecord[]> {
  const normalized: SearchQuestionRecordsArgs =
    typeof args === "string" ? { query: args, tags: legacyTags } : args;

  const trimmedQuery = normalized.query.trim();
  const tagSlugs = normalizeTagLabels(normalized.tags ?? []).map(
    (tag) => tag.slug,
  );
  const limit = clampLimit(normalized.limit ?? 12);
  const filters: Prisma.QuestionWhereInput[] = [];

  if (trimmedQuery.length > 0) {
    filters.push({
      OR: [
        { title: { contains: trimmedQuery, mode: "insensitive" } },
        { body: { contains: trimmedQuery, mode: "insensitive" } },
        { searchText: { contains: trimmedQuery, mode: "insensitive" } },
        {
          answers: {
            some: {
              body: { contains: trimmedQuery, mode: "insensitive" },
            },
          },
        },
        {
          tags: {
            some: {
              tag: {
                label: { contains: trimmedQuery, mode: "insensitive" },
              },
            },
          },
        },
      ],
    });
  }

  if (tagSlugs.length > 0) {
    filters.push({
      tags: {
        some: {
          tag: {
            slug: {
              in: tagSlugs,
            },
          },
        },
      },
    });
  }

  const candidates = await prisma.question.findMany({
    where: filters.length > 0 ? { AND: filters } : undefined,
    include: questionInclude,
    orderBy: {
      lastActivityAt: "desc",
    },
    take: Math.max(limit * 4, limit),
  });

  if (trimmedQuery.length === 0) {
    return candidates.slice(0, limit);
  }

  const needle = trimmedQuery.toLowerCase();

  return candidates
    .map((question) => ({
      question,
      score: rankQuestion(question, needle),
    }))
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }
      return (
        second.question.lastActivityAt.getTime() -
        first.question.lastActivityAt.getTime()
      );
    })
    .map(({ question }) => question)
    .slice(0, limit);
}

export function questionIdentityWhere(
  questionIdOrSlug: string,
): Prisma.QuestionWhereInput {
  return {
    OR: [{ id: questionIdOrSlug }, { slug: questionIdOrSlug }],
  };
}

export function normalizeTagLabels(labels: string[]) {
  const seen = new Set<string>();

  return labels
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      slug: slugify(label),
    }))
    .filter((tag) => {
      if (!tag.slug || seen.has(tag.slug)) {
        return false;
      }
      seen.add(tag.slug);
      return true;
    });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) {
    return 12;
  }
  return Math.min(Math.floor(limit), 50);
}

function rankQuestion(question: QuestionRecord, needle: string): number {
  let score = 0;

  if (question.title.toLowerCase().includes(needle)) {
    score += 6;
  }

  for (const link of question.tags) {
    if (link.tag.label.toLowerCase().includes(needle)) {
      score += 4;
      break;
    }
  }

  if (question.body.toLowerCase().includes(needle)) {
    score += 2;
  }

  for (const answer of question.answers) {
    if (answer.body.toLowerCase().includes(needle)) {
      score += 1;
      break;
    }
  }

  if (question.answers.length > 0) {
    score += 0.25;
  }

  return score;
}
