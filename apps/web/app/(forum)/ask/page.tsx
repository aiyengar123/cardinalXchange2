import Link from "next/link";

import { AskForm } from "@/features/ask";
import type { CreateQuestionInput } from "@/server/http/contracts";

type AskPageProps = {
  searchParams: Promise<{ draft?: string }>;
};

export default async function AskQuestionPage({
  searchParams,
}: AskPageProps) {
  const params = await searchParams;
  const draft = decodeDraft(params.draft);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 sm:px-8">
      <nav aria-label="Breadcrumb" className="mb-4">
        <Link
          className="text-xs font-medium text-[var(--color-ink-500)] transition-colors duration-150 ease-out hover:text-[var(--color-ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          href="/questions"
        >
          Back to questions
        </Link>
      </nav>

      <header className="mb-6 border-b border-[var(--color-border-default)] pb-4">
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[var(--color-ink-900)] sm:text-4xl">
          Ask a Question
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-500)]">
          Get help from the Stanford community. Be specific so a classmate can
          give a useful answer.
        </p>
      </header>

      <AskForm initialDraft={draft} />
    </div>
  );
}

const MAX_DRAFT_LENGTH = 8192;

function decodeDraft(
  value: string | undefined,
): Partial<CreateQuestionInput> | undefined {
  if (!value) return undefined;
  // Drafts arrive over the URL — cap parse work to avoid pathological
  // inputs forcing the server to allocate megabytes during render.
  if (value.length > MAX_DRAFT_LENGTH) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (parsed && typeof parsed === "object") {
      const draft: Partial<CreateQuestionInput> = {};
      const candidate = parsed as Record<string, unknown>;
      if (typeof candidate.title === "string") draft.title = candidate.title;
      if (typeof candidate.body === "string") draft.body = candidate.body;
      if (Array.isArray(candidate.tags)) {
        draft.tags = candidate.tags.filter(
          (entry): entry is string => typeof entry === "string",
        );
      }
      return draft;
    }
  } catch {
    // Malformed query — ignore and start blank. Drafts are transient anyway.
  }
  return undefined;
}
