import type { AnswerDto } from "@/backend/http/contracts";

import { Markdown } from "@/features/questions/components/markdown";

/**
 * Renders every answer in `createdAt asc` order — oldest first, matching the
 * spec. Section header gets a thin underline (no boxed card around the list);
 * answers are stacked with a 1px ink-100 divider between them. Bodies render
 * markdown so numbered lists and links appear like the canonical image.
 */
export function AnswerList({ answers }: { answers: AnswerDto[] }) {
  const heading =
    answers.length === 0 ? "Answers" : `Answers (${answers.length})`;

  return (
    <section
      aria-labelledby="answers-heading"
      aria-live="polite"
      className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 pb-2 pt-5"
    >
      <h2
        className="border-b border-[var(--color-border-default)] pb-2 text-lg font-semibold text-[var(--color-ink-900)]"
        id="answers-heading"
      >
        {heading}
      </h2>

      {answers.length === 0 ? (
        <p className="py-6 text-sm text-[var(--color-ink-500)]">
          No answers yet. Add the first one below.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-ink-100)]">
          {answers.map((answer) => (
            <li className="py-5" key={answer.id}>
              <Markdown source={answer.body} />
              <p className="mt-3 text-xs text-[var(--color-ink-500)]">
                Answer by{" "}
                <span className="font-medium text-[var(--color-ink-700)]">
                  {answer.author}
                </span>{" "}
                · {formatRelative(answer.createdAt)}
              </p>
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
