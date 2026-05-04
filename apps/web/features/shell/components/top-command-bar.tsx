"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

/**
 * Cardinal-red top bar with wordmark, search, and primary Ask Question CTA.
 * Square corners on every interactive element. The search input lives inside
 * a Suspense boundary because it reads `useSearchParams`, which Next requires
 * to be suspended during static rendering.
 */
export function TopCommandBar() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--color-cardinal-700)] bg-[var(--color-cardinal-500)] text-white"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-[1264px] items-center gap-4 px-4 sm:px-6">
        <Link
          aria-label="CardinalXchange home"
          className="shrink-0 text-base font-semibold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href="/questions"
        >
          CardinalXchange
        </Link>

        <Suspense fallback={<SearchFallback />}>
          <SearchField />
        </Suspense>

        <Link
          aria-label="Ask a question"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-white bg-white px-4 text-sm font-semibold text-[var(--color-cardinal-500)] transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          href="/ask"
        >
          Ask Question
        </Link>
      </div>
    </header>
  );
}

function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams?.get("query") ?? "");

  useEffect(() => {
    setQuery(searchParams?.get("query") ?? "");
  }, [searchParams]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = query.trim();
      const target = trimmed
        ? `/questions?query=${encodeURIComponent(trimmed)}`
        : "/questions";
      router.push(target);
    },
    [query, router],
  );

  return (
    <form
      aria-label="Search questions"
      className="flex min-w-0 flex-1 items-center"
      onSubmit={onSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor="top-bar-search">
        Search questions
      </label>
      <input
        autoComplete="off"
        className="block h-9 w-full min-w-0 rounded-md border border-[var(--color-cardinal-700)] bg-white px-4 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-border-focus)]"
        id="top-bar-search"
        name="query"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search questions, tags, and answers"
        type="search"
        value={query}
      />
    </form>
  );
}

function SearchFallback() {
  return (
    <div
      aria-hidden
      className="block h-9 min-w-0 flex-1 rounded-md border border-[var(--color-cardinal-700)] bg-white"
    />
  );
}

export default TopCommandBar;
