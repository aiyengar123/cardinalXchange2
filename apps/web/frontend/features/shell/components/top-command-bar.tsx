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

import { useSession } from "@/frontend/auth/auth-client";
import { UserMenu } from "./user-menu";

/**
 * White top bar with cardinal-red wordmark, search field, and primary
 * Ask Question CTA. The image is the source of truth: white background
 * with a hairline gray bottom border, cardinal-red brand mark on the
 * left, search field flexing between the brand and the CTA, red button
 * on the right.
 */
export function TopCommandBar() {
  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--color-border-default)] bg-white text-[var(--color-ink-900)]"
      role="banner"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-3 sm:h-[68px] sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-0">
        <Link
          aria-label="CardinalXchange home"
          className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-[var(--color-cardinal-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
          href="/questions"
        >
          <BrandMark />
          <span>CardinalXchange</span>
        </Link>

        <Suspense fallback={<SearchFallback />}>
          <SearchField />
        </Suspense>

        <AskQuestionButton />
        <UserMenu />
      </div>
    </header>
  );
}

function AskQuestionButton() {
  const session = useSession();
  const href = session.data ? "/ask" : "/login?next=/ask";
  return (
    <Link
      aria-label="Ask a question"
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-cardinal-500)] px-5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:outline-none"
      href={href}
    >
      Ask Question
    </Link>
  );
}

function BrandMark() {
  return (
    <span
      aria-hidden
      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-cardinal-500)] text-sm leading-none font-bold text-white"
    >
      S
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-500)]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" />
    </svg>
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
      className="relative flex min-w-0 flex-1 items-center"
      onSubmit={onSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor="top-bar-search">
        Search questions
      </label>
      <SearchIcon />
      <input
        autoComplete="off"
        className="block h-10 w-full min-w-[8rem] rounded-lg border border-[var(--color-border-default)] bg-white pr-4 pl-9 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:outline-none focus:ring-inset"
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
    <div className="relative flex min-w-0 flex-1 items-center">
      <label className="sr-only" htmlFor="top-bar-search-fallback">
        Search questions
      </label>
      <SearchIcon />
      <input
        aria-label="Search questions"
        className="block h-10 w-full min-w-[8rem] rounded-lg border border-[var(--color-border-default)] bg-white pr-4 pl-9 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)]"
        disabled
        id="top-bar-search-fallback"
        placeholder="Search questions, tags, and answers"
        type="search"
      />
    </div>
  );
}

export default TopCommandBar;
