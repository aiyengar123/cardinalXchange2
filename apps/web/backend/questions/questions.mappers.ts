import type {
  AnswerRecord,
  QuestionFeedRecord,
  QuestionRecord,
} from "@cardinalxchange/db";

import type {
  AnswerDto,
  QuestionDetailDto,
  QuestionStatus,
  QuestionSummaryDto,
  QuestionTagDto,
} from "@/backend/http/contracts";

/**
 * Pure record → wire DTO mappers. Lives outside `questions.service` so
 * sibling services (answers, search) can import shared mappers without
 * deep-importing a peer service file.
 */

type SummarizableQuestion = QuestionRecord | QuestionFeedRecord;

export function toDetailDto(
  question: QuestionRecord,
  viewerId?: string,
): QuestionDetailDto {
  const answersList = question.answers
    .map((a) => toAnswerDto(a, viewerId))
    .sort((a, b) => b.voteScore - a.voteScore);

  return {
    ...toSummaryDto(question),
    body: question.body,
    createdAt: question.createdAt.toISOString(),
    answersList,
  };
}

export function toSummaryDto(
  question: SummarizableQuestion,
): QuestionSummaryDto {
  // Feed records carry the most recent answer (desc, take: 1) so answers[0]
  // is the latest. Detail records carry the full asc-ordered list, in which
  // case the latest answer is the last entry. `_count.answers` is the
  // authoritative answer count when present (feed include); fall back to
  // `answers.length` for full records.
  const answersCount =
    "_count" in question && question._count
      ? question._count.answers
      : question.answers.length;
  const latestAnswer =
    "_count" in question && question._count
      ? question.answers[0]
      : question.answers[question.answers.length - 1];

  return {
    id: question.id,
    slug: question.slug,
    title: question.title,
    excerpt:
      question.body.length > 170
        ? `${question.body.slice(0, 167)}...`
        : question.body,
    answers: answersCount,
    status: toQuestionStatus(question.status),
    tags: question.tags.map(toTagDto),
    author: question.authorName,
    authorMeta: question.authorMeta ?? "",
    askedAt: relativeTime(question.createdAt),
    activity: latestAnswer
      ? `new answer ${relativeTime(latestAnswer.createdAt)}`
      : "needs first answer",
  };
}

export function toAnswerDto(
  answer: AnswerRecord,
  viewerId?: string,
): AnswerDto {
  const voteScore = answer.votes.reduce((sum, v) => sum + v.value, 0);
  const viewerVoteRecord = viewerId
    ? answer.votes.find((v) => v.userId === viewerId)
    : undefined;
  const viewerVote = (viewerVoteRecord?.value ?? 0) as 1 | -1 | 0;

  return {
    id: answer.id,
    questionId: answer.questionId,
    body: answer.body,
    author: answer.authorName,
    authorMeta: answer.authorMeta ?? "",
    createdAt: answer.createdAt.toISOString(),
    voteScore,
    viewerVote,
  };
}

function toTagDto(
  questionTag: SummarizableQuestion["tags"][number],
): QuestionTagDto {
  return {
    slug: questionTag.tag.slug,
    label: questionTag.tag.label,
    kind: "topic",
  };
}

function toQuestionStatus(status: QuestionRecord["status"]): QuestionStatus {
  // Prisma enum has OPEN | ANSWERED | ACCEPTED. The wire DTO is `open` |
  // `answered`. Map ACCEPTED to `answered` explicitly so the wire stays
  // typed and we don't leak a raw enum value.
  if (status === "ACCEPTED") return "answered";
  return status.toLowerCase() as QuestionStatus;
}

function relativeTime(date: Date): string {
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}
