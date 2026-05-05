"use client";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-6">
      <h1 className="text-lg font-semibold text-[var(--color-ink-900)]">
        Something went wrong while loading the sign-in page.
      </h1>
      <p className="text-sm text-[var(--color-ink-700)]">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)]"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
