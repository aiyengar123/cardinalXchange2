import Link from "next/link";

import type { QuestionDetailDto } from "@/backend/http/contracts";

import { Markdown } from "@/features/questions/components/markdown";

/**
 * Header + body for the question detail page. Lays out flat on the main
 * surface (no bordered card) per the canonical: title → body → tag pills →
 * meta line. Body renders as markdown so links, lists, bold, italic, and
 * code show up correctly.
 */
export function QuestionDetail({ question }: { question: QuestionDetailDto }) {
  return (
    <article className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-6">
      <h1 className="text-[26px] leading-[1.2] font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-[30px]">
        {question.title}
      </h1>

      {question.tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <Link
              className="inline-flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-ink-50)] px-2 py-0.5 text-xs leading-none font-medium text-[var(--color-ink-700)] transition-colors duration-150 ease-out hover:border-[var(--color-cardinal-500)] hover:text-[var(--color-cardinal-500)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
              href={`/questions?tag=${tag.slug}`}
              key={tag.slug}
            >
              {tag.label}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 border-l-2 border-[var(--color-border-default)] pl-4">
        <Markdown source={question.body} />
      </div>

      <div className="mt-4 flex justify-end">
        <p className="text-xs text-[var(--color-ink-500)]">
          Asked by{" "}
          <span className="font-medium text-[var(--color-ink-700)]">
            {question.author}
          </span>{" "}
          · {question.askedAt}
        </p>
      </div>
    </article>
  );
}

export default QuestionDetail;
