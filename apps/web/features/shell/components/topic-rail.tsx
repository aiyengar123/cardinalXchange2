"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@cardinalxchange/ui";

import { railTopics, type RailTopic } from "@/data/topics.data";

/**
 * Left rail with the four canonical entries: CXC AI / Questions / Topics /
 * Trending. Active item gets a 3px cardinal-red left bar and a bold label;
 * everything else stays neutral. Square hit targets, no rounded pills.
 */
export function TopicRail() {
  const pathname = usePathname() ?? "/";
  const activeId = resolveActiveId(pathname);

  return (
    <nav
      aria-label="Sections"
      className="hidden w-[180px] shrink-0 py-6 pr-2 lg:block"
    >
      <ul className="flex flex-col gap-1">
        {railTopics.map((topic) => {
          const active = topic.id === activeId;
          return (
            <li key={topic.id}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center rounded-md border-l-[3px] px-4 text-[15px] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-inset",
                  active
                    ? "border-l-[var(--color-cardinal-500)] bg-[var(--color-ink-50)] font-semibold text-[var(--color-ink-900)]"
                    : "border-l-transparent text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)]",
                )}
                href={topic.href}
              >
                {topic.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function resolveActiveId(pathname: string): RailTopic["id"] | null {
  if (pathname.startsWith("/cxc-ai")) {
    return "cxc-ai";
  }
  if (pathname.startsWith("/questions") || pathname.startsWith("/ask")) {
    return "questions";
  }
  if (pathname === "/") {
    return "home";
  }
  return null;
}

export default TopicRail;
