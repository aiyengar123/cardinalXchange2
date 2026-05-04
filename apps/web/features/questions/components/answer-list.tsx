import type { AnswerDto } from "@/server/http/contracts";

/**
 * Renders every answer in `createdAt asc` order — oldest first, matching the
 * spec. The server returns the list pre-sorted; this component is
 * presentation only. Items are separated by a 1px ink-100 divider, never a
 * card with shadow.
 */
export function AnswerList({ answers }: { answers: AnswerDto[] }) {
  return (
    <section
      aria-labelledby="answers-heading"
      aria-live="polite"
      className="border border-[var(--color-border-default)] bg-[var(--color-surface-base)]"
    >
      <header className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4 sm:px-8">
        <h2
          className="text-base font-semibold text-[var(--color-ink-900)]"
          id="answers-heading"
        >
          {answers.length === 0
            ? "Answers"
            : `${answers.length} ${answers.length === 1 ? "Answer" : "Answers"}`}
        </h2>
      </header>

      {answers.length === 0 ? (
        <p className="px-6 py-10 text-sm text-[var(--color-ink-500)] sm:px-8">
          No answers yet. Add the first one below.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-ink-100)]">
          {answers.map((answer) => (
            <li className="px-6 py-5 sm:px-8" key={answer.id}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-900)]">
                {answer.body}
              </p>
              <p className="mt-3 text-xs text-[var(--color-ink-500)]">
                <span className="font-medium text-[var(--color-ink-700)]">
                  {answer.author}
                </span>
                {answer.authorMeta ? ` · ${answer.authorMeta}` : ""} ·{" "}
                {formatTimestamp(answer.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default AnswerList;
