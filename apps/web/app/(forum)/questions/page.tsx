import Link from "next/link";

import { QuestionFeed } from "@/features/questions";
import { listQuestionsForFeed } from "@/backend/questions/questions.service";
import type { FeedSort } from "@/backend/questions/questions.types";

type QuestionsPageProps = {
  searchParams: Promise<{
    tag?: string;
    sort?: string;
    query?: string;
  }>;
};

const SORT_OPTIONS: ReadonlyArray<{ id: FeedSort; label: string }> = [
  { id: "newest", label: "Newest" },
  { id: "answered", label: "Answered" },
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
    ? questions.filter(
        (question) =>
          question.title.toLowerCase().includes(query.toLowerCase()) ||
          question.excerpt.toLowerCase().includes(query.toLowerCase()),
      )
    : questions;

  const activeSort: FeedSort = sort ?? "newest";

  return (
    <div className="w-full">
      <header className="pt-2" id="tags">
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
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
      </header>

      <nav
        aria-label="Filter questions"
        className="mt-4 flex items-center gap-6 border-b border-[var(--color-border-default)]"
      >
        {SORT_OPTIONS.map((option) => {
          const active = activeSort === option.id;
          const href = sortHref({ sort: option.id, tag, query });
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`-mb-px inline-flex h-10 items-center border-b-2 text-sm font-medium transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none ${
                active
                  ? "border-[var(--color-cardinal-500)] text-[var(--color-cardinal-500)]"
                  : "border-transparent text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
              }`}
              href={href}
              key={option.id}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4">
        <QuestionFeed
          filter={{ tag, query: query || undefined }}
          questions={filtered}
        />
      </div>
    </div>
  );
}

function isFeedSort(value: string | undefined): value is FeedSort {
  return (
    value === "newest" ||
    value === "active" ||
    value === "unanswered" ||
    value === "answered"
  );
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
