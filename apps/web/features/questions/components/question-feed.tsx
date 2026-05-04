import Link from "next/link";

import { QuestionRow } from "@/features/questions/components/question-row";
import type { QuestionRowDto } from "@/server/http/contracts";

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
    <section
      aria-labelledby="questions-feed-heading"
      className="border border-[var(--color-border-default)] bg-[var(--color-surface-base)]"
    >
      <h2 className="sr-only" id="questions-feed-heading">
        Questions
      </h2>
      <ul className="divide-y divide-[var(--color-ink-100)]">
        {questions.map((question) => (
          <li key={question.id}>
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
    <section className="border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-12 text-center">
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
              className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
              href={
                filter?.tag
                  ? `/ask?draft=${encodeURIComponent(JSON.stringify({ tags: [filter.tag] }))}`
                  : "/ask"
              }
            >
              Ask a Question
            </Link>
            <Link
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-semibold text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
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
            className="mt-6 inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
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
