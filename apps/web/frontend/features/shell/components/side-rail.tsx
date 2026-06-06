import Link from "next/link";

import { listTagsForIndex } from "@/backend/tags/tags.service";
import { HistoryRail } from "@/features/shell/components/history-rail";

const MAX_RAIL_TAGS = 7;

export async function SideRail() {
  const allTags = await listTagsForIndex().catch(() => []);
  // Tags arrive ordered by question count desc, so this keeps the top 7;
  // the full list lives on /tags.
  const tags = allTags
    .filter((t) => t.questionCount > 0)
    .slice(0, MAX_RAIL_TAGS);

  return (
    <aside
      aria-label="About and topics"
      className="w-[300px] shrink-0 py-4 pl-2"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
            About cardinalXchange
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-700)]">
            A Stanford-only Q&amp;A space. Ask, answer, and search public
            questions from classmates. CXC AI cites public Q&amp;A when it can.
          </p>
        </div>

        {tags.length > 0 && (
          <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink-900)]">
              Tags
            </h2>
            <ul className="mt-3 divide-y divide-[var(--color-border-default)]">
              {tags.map((tag) => (
                <li key={tag.slug}>
                  <Link
                    className="block px-1 py-2 text-sm text-[var(--color-ink-700)] hover:text-[var(--color-cardinal-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
                    href={`/questions?tag=${tag.slug}`}
                  >
                    {tag.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <HistoryRail />
      </div>
    </aside>
  );
}

export default SideRail;
