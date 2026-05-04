export default function QuestionDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
      <div className="h-4 w-32 bg-[var(--color-ink-100)]" />
      <div className="mt-6 border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-6 sm:px-8">
        <div className="h-8 w-3/4 bg-[var(--color-ink-100)]" />
        <div className="mt-3 h-3 w-1/3 bg-[var(--color-ink-100)]" />
        <div className="mt-6 space-y-2">
          <div className="h-3 w-full bg-[var(--color-ink-100)]" />
          <div className="h-3 w-full bg-[var(--color-ink-100)]" />
          <div className="h-3 w-2/3 bg-[var(--color-ink-100)]" />
        </div>
      </div>
      <div className="mt-6 border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-6 sm:px-8">
        <div className="h-5 w-24 bg-[var(--color-ink-100)]" />
        <div className="mt-4 h-3 w-full bg-[var(--color-ink-100)]" />
        <div className="mt-2 h-3 w-3/4 bg-[var(--color-ink-100)]" />
      </div>
    </div>
  );
}
