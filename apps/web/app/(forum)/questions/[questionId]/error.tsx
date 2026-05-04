"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function QuestionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8">
      <div className="border border-[var(--color-state-danger)] bg-[var(--color-surface-base)] px-5 py-6">
        <h2 className="text-base font-semibold text-[var(--color-state-danger)]">
          Could not load this question.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-700)]">
          The server returned an error. Try again in a moment.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="inline-flex h-9 items-center justify-center border border-transparent bg-[var(--color-cardinal-500)] px-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
            onClick={() => reset()}
            type="button"
          >
            Retry
          </button>
          <Link
            className="inline-flex h-9 items-center justify-center border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-sm font-semibold text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
            href="/questions"
          >
            Back to questions
          </Link>
        </div>
      </div>
    </div>
  );
}
