/**
 * Skeleton for the questions list. Square placeholders, no shimmer gradients.
 */
export default function QuestionsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
      <div className="mb-4 border-b border-[var(--color-border-default)] pb-4">
        <div className="h-9 w-48 bg-[var(--color-ink-100)]" />
      </div>
      <div className="mt-4 flex gap-2 border-b border-[var(--color-border-default)] pb-4">
        {[0, 1, 2].map((index) => (
          <div className="h-8 w-20 bg-[var(--color-ink-100)]" key={index} />
        ))}
      </div>
      <div className="mt-6 border border-[var(--color-border-default)] bg-[var(--color-surface-base)]">
        <ul className="divide-y divide-[var(--color-ink-100)]">
          {[0, 1, 2, 3].map((index) => (
            <li className="px-4 py-4 sm:px-5" key={index}>
              <div className="h-4 w-2/3 bg-[var(--color-ink-100)]" />
              <div className="mt-2 h-3 w-full bg-[var(--color-ink-100)]" />
              <div className="mt-1 h-3 w-1/2 bg-[var(--color-ink-100)]" />
              <div className="mt-3 flex gap-2">
                <div className="h-5 w-14 bg-[var(--color-ink-100)]" />
                <div className="h-5 w-16 bg-[var(--color-ink-100)]" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
