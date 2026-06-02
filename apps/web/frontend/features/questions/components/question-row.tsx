import Link from "next/link";

import type { QuestionRowDto } from "@/backend/http/contracts";

/**
 * One feed row. Two columns: left holds title, snippet, and tags; right
 * holds the answer count above an `author · time` meta line. Title is
 * cardinal-red. Rows are separated by a hairline divider rendered by the
 * parent feed list — this row owns no outer border.
 */
export function QuestionRow({ question }: { question: QuestionRowDto }) {
  const answerCount = question.answers;
  const answerLabel = answerCount === 1 ? "1 answer" : `${answerCount} answers`;

  return (
    <article
      className="flex gap-6 px-6 py-6 transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)]"
      id={question.id}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-lg leading-snug font-semibold">
          <Link
            className="text-[var(--color-cardinal-500)] transition-colors duration-150 ease-out hover:text-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
            href={`/questions/${question.slug}`}
          >
            {question.title}
          </Link>
        </h2>

        {question.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {question.tags.map((tag) => (
              <Link
                className="inline-flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2.5 py-1 text-sm leading-none font-medium text-[var(--color-ink-500)] transition-colors duration-150 ease-out hover:border-[var(--color-cardinal-500)] hover:text-[var(--color-cardinal-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
                href={`/questions?tag=${tag.slug}`}
                key={`${question.id}-${tag.slug}`}
              >
                {tag.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex w-44 shrink-0 flex-col items-end justify-start gap-1 pt-1 text-right">
        <span className="text-base font-medium text-[var(--color-ink-900)]">
          {answerLabel}
        </span>
        <span className="text-sm whitespace-nowrap text-[var(--color-ink-500)]">
          <span className="font-medium text-[var(--color-ink-700)]">
            {question.author}
          </span>
          <span aria-hidden> · </span>
          <span>{question.askedAt}</span>
        </span>
      </div>
    </article>
  );
}

export default QuestionRow;
