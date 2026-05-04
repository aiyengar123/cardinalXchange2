"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import type {
  CreateQuestionInput,
  QuestionDetailDto,
} from "@/server/http/contracts";

type AskFormProps = {
  /** Optional draft preloaded from `?draft=…` on the URL (CXC AI hand-off). */
  initialDraft?: Partial<CreateQuestionInput>;
};

type ApiResponse =
  | { question: QuestionDetailDto }
  | { error?: { code?: string; message?: string } };

/**
 * The Ask a Question form. Square inputs, 2px cardinal-red focus ring (the
 * primitive defaults already implement that). Posts via fetch — no server
 * action so the legacy `app/questions/actions.ts` can be removed.
 */
export function AskForm({ initialDraft }: AskFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState<string>(initialDraft?.title ?? "");
  const [body, setBody] = useState<string>(initialDraft?.body ?? "");
  const [tags, setTags] = useState<string[]>(
    sanitizeInitialTags(initialDraft?.tags),
  );
  const [tagDraft, setTagDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    body?: string;
    form?: string;
  }>({});

  // Re-hydrate when the draft prop changes (e.g. arriving from CXC AI).
  useEffect(() => {
    if (!initialDraft) {
      return;
    }
    if (initialDraft.title) setTitle(initialDraft.title);
    if (initialDraft.body) setBody(initialDraft.body);
    if (initialDraft.tags) setTags(sanitizeInitialTags(initialDraft.tags));
  }, [initialDraft]);

  const remainingTagSlots = Math.max(0, 8 - tags.length);

  const commitTag = useCallback(
    (value: string) => {
      const cleaned = value.trim().replace(/^,+|,+$/g, "").trim();
      if (!cleaned) {
        return;
      }
      setTags((prev) => {
        if (prev.length >= 8) return prev;
        if (prev.includes(cleaned)) return prev;
        return [...prev, cleaned];
      });
      setTagDraft("");
    },
    [],
  );

  const handleTagKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" || event.key === ",") {
        event.preventDefault();
        commitTag(tagDraft);
        return;
      }
      if (event.key === "Backspace" && !tagDraft && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [commitTag, tagDraft, tags.length],
  );

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((entry) => entry !== tag));
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextErrors: typeof fieldErrors = {};
      if (!title.trim()) {
        nextErrors.title = "Title is required.";
      }
      if (!body.trim()) {
        nextErrors.body = "Body is required.";
      }
      if (nextErrors.title || nextErrors.body) {
        setFieldErrors(nextErrors);
        return;
      }
      setFieldErrors({});

      // Commit a pending tag before submit if the user typed one without
      // pressing Enter — common UX expectation.
      const finalTags = tagDraft.trim()
        ? Array.from(new Set([...tags, tagDraft.trim()])).slice(0, 8)
        : tags;

      const payload: CreateQuestionInput = {
        title: title.trim(),
        body: body.trim(),
        tags: finalTags,
      };

      setSubmitting(true);
      try {
        const response = await fetch("/api/questions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await safeJson(response)) as ApiResponse | null;

        if (!response.ok) {
          const message =
            (data && "error" in data && data.error?.message) ||
            "Could not post that question. Try again in a moment.";
          // Server-side zod errors arrive as `field: message`. Map title/body
          // back to the inline field error so the user sees the indicator on
          // the right input.
          if (message.startsWith("title:")) {
            setFieldErrors({ title: message.replace(/^title:\s*/, "") });
          } else if (message.startsWith("body:")) {
            setFieldErrors({ body: message.replace(/^body:\s*/, "") });
          } else {
            setFieldErrors({ form: message });
          }
          return;
        }

        if (data && "question" in data && data.question) {
          router.push(`/questions/${data.question.slug}`);
          router.refresh();
        } else {
          router.push("/questions");
          router.refresh();
        }
      } catch {
        setFieldErrors({
          form: "Network error — could not reach the server.",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [body, fieldErrors, router, tagDraft, tags, title],
  );

  const titleId = "ask-title";
  const bodyId = "ask-body";
  const tagsId = "ask-tags";
  const titleErrorId = "ask-title-error";
  const bodyErrorId = "ask-body-error";
  const formErrorId = "ask-form-error";

  const tagPlaceholder = useMemo(
    () =>
      remainingTagSlots === 0
        ? "Tag limit reached"
        : "Type a topic and press Enter or comma",
    [remainingTagSlots],
  );

  return (
    <form className="flex flex-col gap-6" noValidate onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-[var(--color-ink-900)]"
          htmlFor={titleId}
        >
          Title
        </label>
        <input
          aria-describedby={fieldErrors.title ? titleErrorId : undefined}
          aria-invalid={fieldErrors.title ? "true" : undefined}
          autoComplete="off"
          className={`block h-10 w-full border bg-[var(--color-surface-base)] px-3 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:outline-none focus:ring-2 focus:ring-inset ${
            fieldErrors.title
              ? "border-[var(--color-state-danger)] focus:border-[var(--color-state-danger)] focus:ring-[var(--color-state-danger)]"
              : "border-[var(--color-border-default)] focus:border-[var(--color-border-focus)] focus:ring-[var(--color-border-focus)]"
          }`}
          disabled={submitting}
          id={titleId}
          maxLength={180}
          name="title"
          onChange={(event) => {
            setTitle(event.target.value);
            if (fieldErrors.title) {
              setFieldErrors((prev) => ({ ...prev, title: undefined }));
            }
          }}
          placeholder="What is your question?"
          required
          value={title}
        />
        {fieldErrors.title ? (
          <p
            className="text-xs font-medium text-[var(--color-state-danger)]"
            id={titleErrorId}
            role="alert"
          >
            {fieldErrors.title}
          </p>
        ) : (
          <p className="text-xs text-[var(--color-ink-500)]">
            One sentence, focused on a single ask.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-[var(--color-ink-900)]"
          htmlFor={bodyId}
        >
          Body
        </label>
        <textarea
          aria-describedby={fieldErrors.body ? bodyErrorId : undefined}
          aria-invalid={fieldErrors.body ? "true" : undefined}
          className={`block min-h-48 w-full border bg-[var(--color-surface-base)] px-3 py-2 text-sm leading-relaxed text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:outline-none focus:ring-2 focus:ring-inset ${
            fieldErrors.body
              ? "border-[var(--color-state-danger)] focus:border-[var(--color-state-danger)] focus:ring-[var(--color-state-danger)]"
              : "border-[var(--color-border-default)] focus:border-[var(--color-border-focus)] focus:ring-[var(--color-border-focus)]"
          }`}
          disabled={submitting}
          id={bodyId}
          maxLength={5000}
          name="body"
          onChange={(event) => {
            setBody(event.target.value);
            if (fieldErrors.body) {
              setFieldErrors((prev) => ({ ...prev, body: undefined }));
            }
          }}
          placeholder="Include what you have tried, what would make an answer useful, and any relevant constraints."
          required
          value={body}
        />
        {fieldErrors.body ? (
          <p
            className="text-xs font-medium text-[var(--color-state-danger)]"
            id={bodyErrorId}
            role="alert"
          >
            {fieldErrors.body}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-[var(--color-ink-900)]"
          htmlFor={tagsId}
        >
          Tags
        </label>
        <div className="flex min-h-10 flex-wrap items-center gap-2 border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2 py-1.5 focus-within:border-[var(--color-border-focus)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-border-focus)]">
          {tags.map((tag) => (
            <span
              className="inline-flex items-center gap-1 border border-[var(--color-border-default)] bg-[var(--color-ink-50)] px-2 py-0.5 text-xs font-medium leading-none text-[var(--color-ink-700)]"
              key={tag}
            >
              {tag}
              <button
                aria-label={`Remove tag ${tag}`}
                className="text-[var(--color-ink-500)] transition-colors duration-150 ease-out hover:text-[var(--color-cardinal-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
                disabled={submitting}
                onClick={() => removeTag(tag)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
          <input
            autoComplete="off"
            className="min-w-[10rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:outline-none"
            disabled={submitting || remainingTagSlots === 0}
            id={tagsId}
            name="tags"
            onBlur={() => commitTag(tagDraft)}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={tagPlaceholder}
            value={tagDraft}
          />
        </div>
        <p className="text-xs text-[var(--color-ink-500)]">
          Up to 8 generic topics. No course names. {remainingTagSlots} slot
          {remainingTagSlots === 1 ? "" : "s"} left.
        </p>
      </div>

      {fieldErrors.form ? (
        <p
          className="text-sm font-medium text-[var(--color-state-danger)]"
          id={formErrorId}
          role="alert"
        >
          {fieldErrors.form}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Posting…" : "Post Question"}
        </button>
      </div>
    </form>
  );
}

function sanitizeInitialTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const cleaned: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (cleaned.includes(trimmed)) continue;
    cleaned.push(trimmed);
    if (cleaned.length >= 8) break;
  }
  return cleaned;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export default AskForm;
