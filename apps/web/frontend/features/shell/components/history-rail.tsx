"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getViewHistory,
  type ViewedQuestion,
} from "@/features/questions/components/record-view";

export function HistoryRail() {
  const [history, setHistory] = useState<ViewedQuestion[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const t = setTimeout(() => setHistory(getViewHistory()), 50);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
      <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
        Recently Viewed
      </h2>
      {history.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-ink-500)]">
          No recently viewed posts.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--color-border-default)]">
          {history.map((item) => (
            <li key={item.slug}>
              <Link
                className="block truncate px-1 py-2 text-sm text-[var(--color-ink-700)] hover:text-[var(--color-cardinal-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
                href={`/questions/${item.slug}`}
                title={item.title}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HistoryRail;
