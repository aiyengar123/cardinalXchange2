import Link from "next/link";

import type { QuestionRowDto } from "@/server/http/contracts";

/**
 * A single feed row. Title is the primary link; tags link to the filtered
 * feed; meta line shows author / answer count / time. Square corners,
 * 1px ink-100 divider between rows (handled by the parent feed list).
 */
export function QuestionRow({ question }: { question: QuestionRowDto }) {
  const answerCount = question.answers;

  return (
    <article
      className="px-5 py-6 transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] sm:px-6"
      id={question.id}
    >
      <div className="min-w-0">
        <h2 className="text-[var(--color-ink-900)] text-[15px] font-semibold leading-snug">
          <Link
            className="rounded-none transition-colors duration-150 ease-out hover:text-[var(--color-cardinal-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            href={`/questions/${question.slug}`}
          >
            {question.title}
          </Link>
        </h2>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--color-ink-700)]">
          {question.excerpt}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {question.tags.map((tag) => (
            <Link
              className="inline-flex items-center border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2 py-0.5 text-xs font-medium leading-none text-[var(--color-ink-700)] transition-colors duration-150 ease-out hover:border-[var(--color-cardinal-500)] hover:text-[var(--color-cardinal-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              href={`/questions?tag=${tag.slug}`}
              key={`${question.id}-${tag.slug}`}
            >
              {tag.label}
            </Link>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-500)]">
          <span>
            asked by{" "}
            <span className="font-medium text-[var(--color-ink-700)]">
              {question.author}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>
            {answerCount === 1 ? "1 answer" : `${answerCount} answers`}
          </span>
          <span aria-hidden>·</span>
          <span>{question.askedAt}</span>
        </div>
      </div>
    </article>
  );
}

export default QuestionRow;
