export default function LoginLoading() {
  return (
    <section
      aria-busy
      className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-6"
    >
      <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-ink-100)]" />
      <div className="h-4 w-full animate-pulse rounded bg-[var(--color-ink-100)]" />
      <div className="h-10 w-full animate-pulse rounded bg-[var(--color-ink-100)]" />
    </section>
  );
}
