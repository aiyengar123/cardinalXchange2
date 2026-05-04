import Link from "next/link";

import { QuestionFeed } from "@/features/questions";
import { listQuestionsForFeed } from "@/server/questions/questions.service";
import type { FeedSort } from "@/server/questions/questions.types";

type QuestionsPageProps = {
  searchParams: Promise<{
    tag?: string;
    sort?: string;
    query?: string;
  }>;
};

const SORT_OPTIONS: ReadonlyArray<{ id: FeedSort; label: string }> = [
  { id: "newest", label: "Newest" },
  { id: "active", label: "Active" },
  { id: "unanswered", label: "Unanswered" },
];

export default async function QuestionsPage({
  searchParams,
}: QuestionsPageProps) {
  const params = await searchParams;
  const tag = params.tag?.trim() || undefined;
  const sort = isFeedSort(params.sort) ? params.sort : undefined;
  const query = params.query?.trim() ?? "";

  const questions = await listQuestionsForFeed({ tag, sort });
  const filtered = query
    ? questions.filter((question) =>
        question.title.toLowerCase().includes(query.toLowerCase()) ||
        question.excerpt.toLowerCase().includes(query.toLowerCase()),
      )
    : questions;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border-default)] pb-4">
        <div className="min-w-0">
          <h1
            className="font-serif text-4xl font-semibold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-5xl"
            style={{ borderRadius: "var(--radius-title)" }}
          >
            Questions
          </h1>
          {tag ? (
            <p className="mt-2 text-sm text-[var(--color-ink-500)]">
              Filtered by tag{" "}
              <span className="font-medium text-[var(--color-ink-900)]">
                {tag}
              </span>
              .{" "}
              <Link
                className="text-[var(--color-cardinal-500)] underline-offset-2 hover:underline"
                href="/questions"
              >
                Clear
              </Link>
            </p>
          ) : null}
          {query ? (
            <p className="mt-2 text-sm text-[var(--color-ink-500)]">
              Showing matches for{" "}
              <span className="font-medium text-[var(--color-ink-900)]">
                {query}
              </span>
              .
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-[var(--color-border-default)] pb-4">
        {SORT_OPTIONS.map((option) => {
          const active = (sort ?? "newest") === option.id;
          const href = sortHref({ sort: option.id, tag, query });
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] ${
                active
                  ? "border-[var(--color-cardinal-500)] bg-[var(--color-cardinal-500)] text-white"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] text-[var(--color-ink-700)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-900)]"
              }`}
              href={href}
              key={option.id}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <QuestionFeed questions={filtered} />
      </div>
    </div>
  );
}

function isFeedSort(value: string | undefined): value is FeedSort {
  return value === "newest" || value === "active" || value === "unanswered";
}

function sortHref({
  sort,
  tag,
  query,
}: {
  sort: FeedSort;
  tag?: string;
  query?: string;
}): string {
  const params = new URLSearchParams();
  if (sort !== "newest") {
    params.set("sort", sort);
  }
  if (tag) {
    params.set("tag", tag);
  }
  if (query) {
    params.set("query", query);
  }
  const search = params.toString();
  return search ? `/questions?${search}` : "/questions";
}
