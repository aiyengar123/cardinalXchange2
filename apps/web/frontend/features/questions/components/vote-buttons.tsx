"use client";

import { useState, useTransition } from "react";

type VoteButtonsProps = {
  answerId: string;
  questionId: string;
  initialScore: number;
  initialVote: 1 | -1 | 0;
};

export function VoteButtons({
  answerId,
  questionId,
  initialScore,
  initialVote,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState<1 | -1 | 0>(initialVote);
  const [isPending, startTransition] = useTransition();

  function handleVote(value: 1 | -1) {
    const next: 1 | -1 | 0 = vote === value ? 0 : value;
    const delta = next - vote;
    setScore((s) => s + delta);
    setVote(next);

    startTransition(async () => {
      try {
        await fetch(`/api/questions/${questionId}/answers/${answerId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: next }),
        });
      } catch {
        // revert on failure
        setScore((s) => s - delta);
        setVote(vote);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1 pt-1">
      <button
        aria-label="Upvote"
        aria-pressed={vote === 1}
        className={`rounded p-1 transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none disabled:opacity-40 ${
          vote === 1
            ? "text-[var(--color-cardinal-500)]"
            : "text-[var(--color-ink-400)] hover:text-[var(--color-ink-900)]"
        }`}
        disabled={isPending}
        onClick={() => handleVote(1)}
        type="button"
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            clipRule="evenodd"
            d="M10 3a.75.75 0 0 1 .57.265l6.25 7.5A.75.75 0 0 1 16.25 12h-2.5v5.25a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75V12H3.75a.75.75 0 0 1-.57-1.235l6.25-7.5A.75.75 0 0 1 10 3Z"
            fillRule="evenodd"
          />
        </svg>
      </button>

      <span
        className={`text-sm font-semibold tabular-nums ${
          score > 0
            ? "text-[var(--color-cardinal-500)]"
            : score < 0
              ? "text-[var(--color-ink-500)]"
              : "text-[var(--color-ink-700)]"
        }`}
      >
        {score}
      </span>

      <button
        aria-label="Downvote"
        aria-pressed={vote === -1}
        className={`rounded p-1 transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none disabled:opacity-40 ${
          vote === -1
            ? "text-[var(--color-cardinal-500)]"
            : "text-[var(--color-ink-400)] hover:text-[var(--color-ink-900)]"
        }`}
        disabled={isPending}
        onClick={() => handleVote(-1)}
        type="button"
      >
        <svg
          aria-hidden
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            clipRule="evenodd"
            d="M10 17a.75.75 0 0 1-.57-.265l-6.25-7.5A.75.75 0 0 1 3.75 8h2.5V2.75A.75.75 0 0 1 7 2h6a.75.75 0 0 1 .75.75V8h2.5a.75.75 0 0 1 .57 1.235l-6.25 7.5A.75.75 0 0 1 10 17Z"
            fillRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

export default VoteButtons;
