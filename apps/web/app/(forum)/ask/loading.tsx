export default function AskLoading() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="h-9 w-56 rounded-md bg-[var(--color-ink-100)]" />
        <div className="mt-3 h-3 w-3/4 rounded-md bg-[var(--color-ink-100)]" />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-10 rounded-md bg-[var(--color-ink-100)]" />
          <div className="h-10 w-full rounded-md bg-[var(--color-ink-100)]" />
          <div className="h-3 w-2/3 rounded-md bg-[var(--color-ink-100)]" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-12 rounded-md bg-[var(--color-ink-100)]" />
          <div className="h-56 w-full rounded-md bg-[var(--color-ink-100)]" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-10 rounded-md bg-[var(--color-ink-100)]" />
          <div className="h-10 w-full rounded-md bg-[var(--color-ink-100)]" />
          <div className="h-3 w-1/2 rounded-md bg-[var(--color-ink-100)]" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-default)] pt-4">
          <div className="h-9 w-20 rounded-md bg-[var(--color-ink-100)]" />
          <div className="h-9 w-36 rounded-md bg-[var(--color-ink-100)]" />
        </div>
      </div>
    </div>
  );
}
