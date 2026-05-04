"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@cardinalxchange/ui";

import { railSections, type RailTopic } from "@/data/topics.data";

/**
 * Left rail. Five entries with icons: Home, Questions, Ask, CXC AI, Tags.
 * Active item gets a rounded gray pill (no left bar, per the canonical
 * image). Hidden below `md:` so the small-screen surface is the page only.
 */
export function TopicRail() {
  const pathname = usePathname() ?? "/";
  const activeId = resolveActiveId(pathname);

  return (
    <nav
      aria-label="Sections"
      className="sticky top-[68px] hidden h-[calc(100vh-68px)] w-[208px] shrink-0 self-start overflow-y-auto py-6 md:block"
    >
      <div className="flex flex-col">
        {railSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {sectionIndex > 0 ? (
              <div
                aria-hidden
                className="mx-4 my-3 h-[1px] w-auto bg-[var(--color-ink-300)]"
                role="separator"
              />
            ) : null}
            <ul className="flex flex-col gap-1">
              {section.items.map((topic) => {
                const active = topic.id === activeId;
                return (
                  <li key={topic.id}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-lg px-4 text-base transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]",
                        active
                          ? "bg-[var(--color-ink-100)] font-semibold text-[var(--color-ink-900)]"
                          : "text-[var(--color-ink-700)] hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)]",
                      )}
                      href={topic.href}
                    >
                      <RailIcon id={topic.id} />
                      <span>{topic.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function RailIcon({ id }: { id: RailTopic["id"] }): ReactNode {
  const common = {
    "aria-hidden": true as const,
    className: "h-5 w-5 shrink-0",
    fill: "none" as const,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.75,
    viewBox: "0 0 24 24",
  };
  switch (id) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
        </svg>
      );
    case "questions":
      return (
        <svg {...common}>
          <rect height="16" rx="2" width="14" x="5" y="4" />
          <path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
      );
    case "ask":
      return (
        <svg {...common}>
          <path d="M4 20h4l11-11a2.83 2.83 0 0 0-4-4L4 16Z" />
          <path d="m13.5 6.5 4 4" />
        </svg>
      );
    case "cxc-ai":
      return (
        <svg {...common}>
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "tags":
      return (
        <svg {...common}>
          <path d="M3 7v6l9 9 7-7-9-9H3Z" />
          <circle cx="7" cy="11" fill="currentColor" r="1" />
        </svg>
      );
    default:
      return null;
  }
}

function resolveActiveId(pathname: string): RailTopic["id"] | null {
  if (pathname.startsWith("/cxc-ai")) {
    return "cxc-ai";
  }
  if (pathname.startsWith("/ask")) {
    return "ask";
  }
  if (pathname.startsWith("/tags")) {
    return "tags";
  }
  if (pathname.startsWith("/questions")) {
    return "questions";
  }
  if (pathname === "/") {
    return "home";
  }
  return null;
}

export default TopicRail;
