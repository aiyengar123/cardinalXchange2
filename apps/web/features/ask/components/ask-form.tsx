"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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

const MAX_TAGS = 5;

/**
 * Ask a Question form. Square inputs with a 2px cardinal-red focus ring,
 * a markdown toolbar over the Details textarea, Cancel + Submit Question
 * actions on the bottom row.
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

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  // Re-hydrate when the draft prop changes (e.g. arriving from CXC AI).
  useEffect(() => {
    if (!initialDraft) {
      return;
    }
    if (initialDraft.title) setTitle(initialDraft.title);
    if (initialDraft.body) setBody(initialDraft.body);
    if (initialDraft.tags) setTags(sanitizeInitialTags(initialDraft.tags));
  }, [initialDraft]);

  const remainingTagSlots = Math.max(0, MAX_TAGS - tags.length);

  const commitTag = useCallback((value: string) => {
    const cleaned = value.trim().replace(/^,+|,+$/g, "").trim();
    if (!cleaned) {
      return;
    }
    setTags((prev) => {
      if (prev.length >= MAX_TAGS) return prev;
      if (prev.includes(cleaned)) return prev;
      return [...prev, cleaned];
    });
    setTagDraft("");
  }, []);

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

  const wrapBodySelection = useCallback(
    (left: string, right: string = left) => {
      const ta = bodyRef.current;
      if (!ta) return;
      const start = ta.selectionStart ?? body.length;
      const end = ta.selectionEnd ?? body.length;
      const selected = body.slice(start, end);
      const next = `${body.slice(0, start)}${left}${selected}${right}${body.slice(end)}`;
      setBody(next);
      requestAnimationFrame(() => {
        ta.focus();
        const cursorStart = start + left.length;
        const cursorEnd = cursorStart + selected.length;
        ta.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [body],
  );

  const prefixBodyLines = useCallback(
    (prefixFn: (lineIndex: number) => string) => {
      const ta = bodyRef.current;
      if (!ta) return;
      const start = ta.selectionStart ?? 0;
      const end = ta.selectionEnd ?? 0;
      const before = body.slice(0, start);
      const selected = body.slice(start, end) || "";
      const after = body.slice(end);
      const lineStart = before.lastIndexOf("\n") + 1;
      const head = body.slice(0, lineStart);
      const block = body.slice(lineStart, end);
      const lines = block.length === 0 ? [""] : block.split("\n");
      const decorated = lines
        .map((line, i) => `${prefixFn(i)}${line}`)
        .join("\n");
      const next = `${head}${decorated}${after}`;
      setBody(next);
      requestAnimationFrame(() => {
        ta.focus();
        const newEnd = head.length + decorated.length;
        ta.setSelectionRange(head.length, newEnd);
      });
      // selected is intentionally referenced so downstream callers can extend
      // this helper to return the slice; current callers only need the side
      // effect.
      void selected;
    },
    [body],
  );

  const insertLink = useCallback(() => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? body.length;
    const end = ta.selectionEnd ?? body.length;
    const selected = body.slice(start, end) || "link text";
    const insertion = `[${selected}](https://)`;
    const next = `${body.slice(0, start)}${insertion}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => {
      ta.focus();
      const urlStart = start + selected.length + 3; // past `[text](`
      ta.setSelectionRange(urlStart, urlStart + 8); // select `https://`
    });
  }, [body]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const nextErrors: typeof fieldErrors = {};
      if (!title.trim()) {
        nextErrors.title = "Title is required.";
      }
      if (!body.trim()) {
        nextErrors.body = "Details are required.";
      }
      if (nextErrors.title || nextErrors.body) {
        setFieldErrors(nextErrors);
        return;
      }
      setFieldErrors({});

      // Commit a pending tag before submit if the user typed one without
      // pressing Enter — common UX expectation.
      const finalTags = tagDraft.trim()
        ? Array.from(new Set([...tags, tagDraft.trim()])).slice(0, MAX_TAGS)
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
    [body, router, tagDraft, tags, title],
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
        : `Add up to ${MAX_TAGS} tags (e.g. eduroam, access, dataviz)`,
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
          className={`block h-10 w-full rounded-md border bg-[var(--color-surface-base)] px-3 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:outline-none focus:ring-2 focus:ring-inset ${
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
          placeholder="Summarize your question in one line"
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
            Be specific and imagine you&apos;re asking a question to another
            person.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-[var(--color-ink-900)]"
          htmlFor={bodyId}
        >
          Details
        </label>
        <div
          className={`overflow-hidden rounded-md border ${
            fieldErrors.body
              ? "border-[var(--color-state-danger)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-state-danger)]"
              : "border-[var(--color-border-default)] focus-within:border-[var(--color-border-focus)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-border-focus)]"
          } bg-[var(--color-surface-base)]`}
        >
          <div
            aria-label="Formatting"
            className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-2 py-1.5"
            role="toolbar"
          >
            <ToolbarButton
              disabled={submitting}
              label="Bold"
              onAction={() => wrapBodySelection("**")}
            >
              <span className="font-bold">B</span>
            </ToolbarButton>
            <ToolbarButton
              disabled={submitting}
              label="Italic"
              onAction={() => wrapBodySelection("*")}
            >
              <span className="font-serif italic">I</span>
            </ToolbarButton>
            <ToolbarButton
              disabled={submitting}
              label="Inline code"
              onAction={() => wrapBodySelection("`")}
            >
              <CodeIcon />
            </ToolbarButton>
            <ToolbarButton
              disabled={submitting}
              label="Link"
              onAction={insertLink}
            >
              <LinkIcon />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              disabled={submitting}
              label="Bulleted list"
              onAction={() => prefixBodyLines(() => "- ")}
            >
              <UnorderedListIcon />
            </ToolbarButton>
            <ToolbarButton
              disabled={submitting}
              label="Numbered list"
              onAction={() => prefixBodyLines((i) => `${i + 1}. `)}
            >
              <OrderedListIcon />
            </ToolbarButton>
            <ToolbarDivider />
            <ToolbarButton
              disabled={submitting}
              label="Undo"
              onAction={() => {
                bodyRef.current?.focus();
                document.execCommand("undo");
              }}
            >
              <UndoIcon />
            </ToolbarButton>
            <ToolbarButton
              disabled={submitting}
              label="Redo"
              onAction={() => {
                bodyRef.current?.focus();
                document.execCommand("redo");
              }}
            >
              <RedoIcon />
            </ToolbarButton>
          </div>
          <textarea
            aria-describedby={fieldErrors.body ? bodyErrorId : undefined}
            aria-invalid={fieldErrors.body ? "true" : undefined}
            className="block min-h-56 w-full resize-y bg-transparent px-3 py-3 text-sm leading-relaxed text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:outline-none"
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
            placeholder="Provide all the details someone would need to answer your question. Include context, what you've tried, relevant examples, and any error messages."
            ref={bodyRef}
            required
            value={body}
          />
        </div>
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
        <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-2 py-1.5 focus-within:border-[var(--color-border-focus)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--color-border-focus)]">
          {tags.map((tag) => (
            <span
              className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border-default)] bg-[var(--color-ink-50)] px-2 py-0.5 text-xs font-medium leading-none text-[var(--color-ink-700)]"
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
          Use specific tags to help others find your question.
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

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-default)] pt-4">
        <Link
          aria-disabled={submitting}
          className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-4 text-sm font-medium text-[var(--color-ink-700)] transition-colors duration-150 ease-out hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2"
          href="/questions"
        >
          Cancel
        </Link>
        <button
          className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Submitting…" : "Submit Question"}
        </button>
      </div>
    </form>
  );
}

function ToolbarButton({
  children,
  disabled,
  label,
  onAction,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onAction: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-ink-700)] transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAction();
        }
      }}
      onMouseDown={(event) => {
        // Prevent the textarea from losing focus (and thus its selection
        // range) before the action runs. Without this, "Bold" wraps the
        // empty cursor position instead of the highlighted text.
        event.preventDefault();
        if (disabled) return;
        onAction();
      }}
      tabIndex={disabled ? -1 : 0}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 h-4 w-px bg-[var(--color-border-default)]"
    />
  );
}

function CodeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function UnorderedListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="10" x2="21" y1="6" y2="6" />
      <line x1="10" x2="21" y1="12" y2="12" />
      <line x1="10" x2="21" y1="18" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 2.96L3 13" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 2.96L21 13" />
    </svg>
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
    if (cleaned.length >= MAX_TAGS) break;
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
