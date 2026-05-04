export default function AskLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 sm:px-8">
      <div className="h-4 w-32 bg-[var(--color-ink-100)]" />
      <div className="mt-6 border-b border-[var(--color-border-default)] pb-4">
        <div className="h-8 w-56 bg-[var(--color-ink-100)]" />
        <div className="mt-3 h-3 w-3/4 bg-[var(--color-ink-100)]" />
      </div>
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <div className="h-3 w-12 bg-[var(--color-ink-100)]" />
          <div className="h-10 w-full bg-[var(--color-ink-100)]" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-12 bg-[var(--color-ink-100)]" />
          <div className="h-48 w-full bg-[var(--color-ink-100)]" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-12 bg-[var(--color-ink-100)]" />
          <div className="h-10 w-full bg-[var(--color-ink-100)]" />
        </div>
      </div>
    </div>
  );
}
