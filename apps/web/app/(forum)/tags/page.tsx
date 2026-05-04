import Link from "next/link";

import { listTagsForIndex } from "@/backend/tags";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await listTagsForIndex();

  return (
    <div className="w-full">
      <header className="pt-2">
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
          Tags
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-500)]">
          A tag is a generic topic label. Browse a tag to see every question
          filed under it.
        </p>
      </header>

      {tags.length === 0 ? (
        <section className="mt-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-6 py-12 text-center">
          <p className="text-base font-medium text-[var(--color-ink-900)]">
            No tags yet.
          </p>
          <p className="mt-2 text-sm text-[var(--color-ink-500)]">
            Tags appear here once questions get posted with them.
          </p>
          <Link
            className="mt-6 inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
            href="/ask"
          >
            Ask a Question
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <Link
              className="group flex flex-col gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4 transition-colors duration-150 ease-out hover:border-[var(--color-cardinal-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              href={`/questions?tag=${tag.slug}`}
              key={tag.slug}
            >
              <span className="inline-flex max-w-fit items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-ink-50)] px-2 py-0.5 text-xs font-medium leading-none text-[var(--color-ink-700)] group-hover:border-[var(--color-cardinal-500)] group-hover:text-[var(--color-cardinal-500)]">
                {tag.label}
              </span>
              <span className="text-xs text-[var(--color-ink-500)]">
                {tag.questionCount === 1
                  ? "1 question"
                  : `${tag.questionCount} questions`}
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
