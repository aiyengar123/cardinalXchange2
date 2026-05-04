"use client";

import { useEffect } from "react";

export default function QuestionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to dev console; no analytics yet.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-8">
      <div className="border border-[var(--color-state-danger)] bg-[var(--color-surface-base)] px-5 py-6">
        <h2 className="text-base font-semibold text-[var(--color-state-danger)]">
          Could not load questions.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-700)]">
          The server returned an error. Try again in a moment.
        </p>
        <button
          className="mt-4 inline-flex h-9 items-center justify-center border border-transparent bg-[var(--color-cardinal-500)] px-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
          onClick={() => reset()}
          type="button"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
