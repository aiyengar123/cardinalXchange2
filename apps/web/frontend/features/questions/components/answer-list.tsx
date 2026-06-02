import type { AnswerDto } from "@/backend/http/contracts";

import { Markdown } from "@/features/questions/components/markdown";
import { VoteButtons } from "@/features/questions/components/vote-buttons";

/**
 * Renders every answer in `createdAt asc` order — oldest first, matching the
 * spec. Section header gets a thin underline (no boxed card around the list);
 * answers are stacked with a 1px ink-100 divider between them. Bodies render
 * markdown so numbered lists and links appear like the canonical image.
 */
export function AnswerList({
  answers,
  questionId,
}: {
  answers: AnswerDto[];
  questionId: string;
}) {
  const heading =
    answers.length === 0 ? "Answers" : `Answers (${answers.length})`;

  return (
    <section aria-labelledby="answers-heading" aria-live="polite">
      <h2
        className="mb-3 text-lg font-semibold text-[var(--color-ink-900)]"
        id="answers-heading"
      >
        {heading}
      </h2>

      {answers.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-6">
          <p className="text-sm text-[var(--color-ink-500)]">
            No answers yet. Add the first one below.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {answers.map((answer) => (
            <li className="flex items-start gap-3" key={answer.id}>
              <div className="shrink-0">
                <VoteButtons
                  answerId={answer.id}
                  initialScore={answer.voteScore}
                  initialVote={answer.viewerVote}
                  questionId={questionId}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-5">
                <Markdown source={answer.body} />
                <p className="mt-3 self-end text-xs text-[var(--color-ink-500)]">
                  Answer by{" "}
                  <span className="font-medium text-[var(--color-ink-700)]">
                    {answer.author}
                  </span>{" "}
                  · {formatRelative(answer.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatRelative(value: string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return value;
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(then),
  );
}

export default AnswerList;
