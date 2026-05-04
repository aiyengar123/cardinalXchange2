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
      <div className="mx-auto flex max-w-[1264px] flex-col gap-2 px-4 py-2 sm:flex-row sm:h-14 sm:items-center sm:gap-4 sm:py-0 sm:px-6">
        <div className="flex items-center justify-between gap-3 sm:contents">
          <Link
            aria-label="CardinalXchange home"
            className="shrink-0 text-base font-semibold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            href="/questions"
          >
            CardinalXchange
          </Link>

          <Link
            aria-label="Ask a question"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-white bg-white px-4 text-sm font-semibold text-[var(--color-cardinal-500)] transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:order-3"
            href="/ask"
          >
            Ask Question
          </Link>
        </div>

        <Suspense fallback={<SearchFallback />}>
          <SearchField />
        </Suspense>
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
      className="flex w-full min-w-0 items-center sm:order-2 sm:flex-1"
      onSubmit={onSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor="top-bar-search">
        Search questions
      </label>
      <input
        autoComplete="off"
        className="block h-9 w-full min-w-[8rem] rounded-md border border-[var(--color-cardinal-700)] bg-white px-4 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-border-focus)]"
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
  // Render a real (disabled) input so keyboard users can still see the
  // search affordance during hydration. `aria-hidden` here would have
  // caused screen readers to skip the search entirely while the route
  // params suspense unblocks.
  return (
    <div className="flex w-full min-w-0 items-center sm:order-2 sm:flex-1">
      <label className="sr-only" htmlFor="top-bar-search-fallback">
        Search questions
      </label>
      <input
        aria-label="Search questions"
        className="block h-9 w-full min-w-[8rem] rounded-md border border-[var(--color-cardinal-700)] bg-white px-4 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]"
        disabled
        id="top-bar-search-fallback"
        placeholder="Search questions, tags, and answers"
        type="search"
      />
    </div>
  );
}

export default TopCommandBar;
