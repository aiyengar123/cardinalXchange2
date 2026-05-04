/**
 * Skeleton for the questions list. Matches the live layout: serif title,
 * underline filter row, and a stack of plain rows separated by hairline
 * dividers. Square placeholders, no shimmer.
 */
export default function QuestionsLoading() {
  return (
    <div className="w-full py-2">
      <div className="pt-2">
        <div className="h-10 w-48 rounded-sm bg-[var(--color-ink-100)]" />
      </div>
      <div className="mt-4 flex gap-6 border-b border-[var(--color-border-default)]">
        {[0, 1, 2].map((index) => (
          <div
            className="h-10 w-20 -mb-px border-b-2 border-transparent"
            key={index}
          >
            <div className="mt-2 h-4 w-full bg-[var(--color-ink-100)]" />
          </div>
        ))}
      </div>
      <ul className="divide-y divide-[var(--color-border-default)]">
        {[0, 1, 2, 3].map((index) => (
          <li className="flex gap-6 px-1 py-5" key={index}>
            <div className="min-w-0 flex-1">
              <div className="h-4 w-2/3 bg-[var(--color-ink-100)]" />
              <div className="mt-2 h-3 w-full bg-[var(--color-ink-100)]" />
              <div className="mt-1 h-3 w-1/2 bg-[var(--color-ink-100)]" />
              <div className="mt-3 flex gap-2">
                <div className="h-5 w-14 bg-[var(--color-ink-100)]" />
                <div className="h-5 w-16 bg-[var(--color-ink-100)]" />
              </div>
            </div>
            <div className="flex w-32 shrink-0 flex-col items-end gap-1 pt-0.5">
              <div className="h-4 w-16 bg-[var(--color-ink-100)]" />
              <div className="h-3 w-24 bg-[var(--color-ink-100)]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
