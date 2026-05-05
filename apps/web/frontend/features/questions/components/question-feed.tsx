import Link from "next/link";

import { buttonVariants, cn } from "@cardinalxchange/ui";

import { QuestionRow } from "@/features/questions/components/question-row";
import type { QuestionRowDto } from "@/backend/http/contracts";

type QuestionFeedFilter = {
  tag?: string;
  query?: string;
};

type QuestionFeedProps = {
  questions: QuestionRowDto[];
  /**
   * Active feed filter. When set and `questions` is empty the feed shows a
   * "no matches" empty state with a clear-filter link rather than the
   * unfiltered "no questions yet" copy.
   */
  filter?: QuestionFeedFilter;
};

/**
 * List container for the questions feed. Composes `QuestionRow` items with a
 * 1px ink-100 divider between rows. Empty state branches on whether a filter
 * is active so the user can tell "no matches for this filter" apart from
 * "the DB is empty".
 */
export function QuestionFeed({ questions, filter }: QuestionFeedProps) {
  if (questions.length === 0) {
    return <QuestionFeedEmptyState filter={filter} />;
  }

  return (
    <section aria-labelledby="questions-feed-heading">
      <h2 className="sr-only" id="questions-feed-heading">
        Questions
      </h2>
      <ul className="flex flex-col gap-3">
        {questions.map((question) => (
          <li
            className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)]"
            key={question.id}
          >
            <QuestionRow question={question} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function QuestionFeedEmptyState({
  filter,
}: {
  filter?: QuestionFeedFilter;
}) {
  const filtered = Boolean(filter?.tag || filter?.query);

  return (
    <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-12 text-center">
      {filtered ? (
        <>
          <p className="text-base font-medium text-[var(--color-ink-900)]">
            {filter?.tag ? (
              <>
                No questions tagged{" "}
                <code className="rounded-sm bg-[var(--color-ink-50)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-ink-900)]">
                  {filter.tag}
                </code>{" "}
                yet.
              </>
            ) : (
              <>
                No questions match{" "}
                <code className="rounded-sm bg-[var(--color-ink-50)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-ink-900)]">
                  {filter?.query}
                </code>{" "}
                yet.
              </>
            )}
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Try a different filter or ask a new question with this tag to start
            the thread.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              className={buttonVariants({ variant: "primary" })}
              href={
                filter?.tag
                  ? `/ask?draft=${encodeURIComponent(JSON.stringify({ tags: [filter.tag] }))}`
                  : "/ask"
              }
            >
              Ask a Question
            </Link>
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href="/questions"
            >
              Clear filter
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="text-base font-medium text-[var(--color-ink-900)]">
            No questions yet. Be the first — Ask a Question.
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Post a focused question with enough context for a classmate to
            answer.
          </p>
          <Link
            className={cn("mt-6", buttonVariants({ variant: "primary" }))}
            href="/ask"
          >
            Ask a Question
          </Link>
        </>
      )}
    </section>
  );
}

export default QuestionFeed;
