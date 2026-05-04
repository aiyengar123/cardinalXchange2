import Link from "next/link";

import { topicTags } from "@/data/topics.data";

/**
 * Right rail — Stack-Overflow-proportioned (~300px) but scope-safe: no Hot
 * Network, no Collectives, no votes, no reputation. Two square 1px-border
 * cards: a one-line "About" blurb and a Topics list driven by
 * `apps/web/data/topics.data.ts`.
 */
export function SideRail() {
  return (
    <aside
      aria-label="About and topics"
      className="hidden w-[300px] shrink-0 py-4 pl-2 xl:block"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
            About CardinalXchange
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-700)]">
            A Stanford-only Q&amp;A space. Ask, answer, and search public
            questions from classmates. CXC AI cites public Q&amp;A when it can.
          </p>
        </div>

        <div className="rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
            Tags
          </h2>
          <ul className="mt-3 flex flex-col gap-1">
            {topicTags.map((tag) => (
              <li key={tag.slug}>
                <Link
                  className="block px-1 py-1 text-sm text-[var(--color-ink-700)] hover:text-[var(--color-cardinal-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                  href={`/questions?tag=${tag.slug}`}
                >
                  {tag.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

export default SideRail;
