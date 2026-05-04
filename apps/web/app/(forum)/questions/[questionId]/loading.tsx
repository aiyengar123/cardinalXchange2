export default function QuestionDetailLoading() {
  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-6">
        <div className="h-7 w-3/4 bg-[var(--color-ink-100)]" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full bg-[var(--color-ink-100)]" />
          <div className="h-3 w-full bg-[var(--color-ink-100)]" />
          <div className="h-3 w-2/3 bg-[var(--color-ink-100)]" />
        </div>
        <div className="mt-5 flex gap-2">
          <div className="h-5 w-14 bg-[var(--color-ink-100)]" />
          <div className="h-5 w-14 bg-[var(--color-ink-100)]" />
          <div className="h-5 w-20 bg-[var(--color-ink-100)]" />
        </div>
        <div className="mt-3 h-3 w-1/3 bg-[var(--color-ink-100)]" />
      </div>
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 pb-2 pt-5">
        <div className="border-b border-[var(--color-border-default)] pb-2">
          <div className="h-5 w-24 bg-[var(--color-ink-100)]" />
        </div>
        <div className="py-5">
          <div className="h-3 w-full bg-[var(--color-ink-100)]" />
          <div className="mt-2 h-3 w-3/4 bg-[var(--color-ink-100)]" />
        </div>
      </div>
    </div>
  );
}
