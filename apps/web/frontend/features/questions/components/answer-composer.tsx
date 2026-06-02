"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { Button } from "@cardinalxchange/ui";

import type { CreateAnswerInput } from "@/backend/http/contracts";

type AnswerComposerProps = {
  questionId: string;
};

type ApiErrorBody = {
  error?: { code?: string; message?: string };
};

/**
 * Posts an answer via `POST /api/questions/[id]/answers`. The editor is a
 * `contentEditable` surface so toolbar actions (bold, italic, code, link,
 * lists) render formatting inline as you apply them — no asterisks visible.
 * On submit the editor's HTML is normalized into markdown so the backend
 * contract (markdown body) is unchanged.
 */
export function AnswerComposer({ questionId }: AnswerComposerProps) {
  const router = useRouter();
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();
  const editorRef = useRef<HTMLDivElement | null>(null);

  // Keep selection inside the editor when toolbar buttons are pressed.
  const preserveSelection = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    },
    [],
  );

  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  const exec = useCallback(
    (command: string, value?: string) => {
      focusEditor();
      document.execCommand(command, false, value);
      syncEmpty();
    },
    [focusEditor],
  );

  const syncEmpty = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = editor.textContent ?? "";
    setIsEmpty(text.trim().length === 0);
  }, []);

  const wrapSelectionInCode = useCallback(() => {
    focusEditor();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const editor = editorRef.current;
    if (!editor || !editor.contains(range.commonAncestorContainer)) return;

    const code = document.createElement("code");
    try {
      range.surroundContents(code);
    } catch {
      // Range crosses element boundaries — fall back to extracting + wrapping.
      const fragment = range.extractContents();
      code.appendChild(fragment);
      range.insertNode(code);
    }
    selection.removeAllRanges();
    const after = document.createRange();
    after.setStartAfter(code);
    after.collapse(true);
    selection.addRange(after);
    syncEmpty();
  }, [focusEditor, syncEmpty]);

  const insertLink = useCallback(() => {
    focusEditor();
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    document.execCommand("createLink", false, url);
    // Force the inserted anchor to open in a new tab.
    const editor = editorRef.current;
    if (editor) {
      editor.querySelectorAll("a[href]").forEach((a) => {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noreferrer noopener");
      });
    }
    syncEmpty();
  }, [focusEditor, syncEmpty]);

  // Track empty state on every input.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handler = () => syncEmpty();
    editor.addEventListener("input", handler);
    return () => editor.removeEventListener("input", handler);
  }, [syncEmpty]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const editor = editorRef.current;
      if (!editor) return;
      const markdown = htmlToMarkdown(editor).trim();
      if (!markdown) {
        setError("Answer body is required.");
        return;
      }

      setSubmitting(true);
      try {
        const payload: CreateAnswerInput = { body: markdown };
        const response = await fetch(
          `/api/questions/${encodeURIComponent(questionId)}/answers`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          const data = (await safeJson(response)) as ApiErrorBody | null;
          setError(
            data?.error?.message ??
              "Could not post that answer. Try again in a moment.",
          );
          return;
        }

        editor.innerHTML = "";
        setIsEmpty(true);
        setOpen(false);
        startTransition(() => {
          router.refresh();
        });
      } catch {
        setError("Network error — could not reach the server.");
      } finally {
        setSubmitting(false);
      }
    },
    [questionId, router],
  );

  const [open, setOpen] = useState(false);

  const editorId = "answer-body";
  const errorId = "answer-error";

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    if (editorRef.current) editorRef.current.innerHTML = "";
    setIsEmpty(true);
    setError(null);
    setOpen(false);
  }

  return (
    <>
      <Button
        size="sm"
        className="px-3 text-xs"
        onClick={openModal}
        type="button"
      >
        Post an Answer
      </Button>

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-2xl rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
                Your Answer
              </h2>
              <button
                aria-label="Close"
                className="text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
                disabled={submitting}
                onClick={closeModal}
                type="button"
              >
                <svg
                  aria-hidden
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form className="p-6" onSubmit={onSubmit} noValidate>
              <div
                className={`overflow-hidden rounded-md border bg-[var(--color-surface-base)] ${
                  error
                    ? "border-[var(--color-state-danger)] focus-within:ring-2 focus-within:ring-[var(--color-state-danger)] focus-within:ring-inset"
                    : "border-[var(--color-border-default)] focus-within:border-[var(--color-border-focus)] focus-within:ring-2 focus-within:ring-[var(--color-border-focus)] focus-within:ring-inset"
                }`}
              >
                <div
                  aria-label="Formatting"
                  className="flex flex-wrap items-center gap-1 border-b border-[var(--color-border-default)] bg-[var(--color-surface-sunk)] px-2 py-1.5"
                  role="toolbar"
                >
                  <ToolbarButton
                    disabled={submitting}
                    label="Bold"
                    onMouseDown={preserveSelection}
                    onClick={() => exec("bold")}
                  >
                    <span className="font-bold">B</span>
                  </ToolbarButton>
                  <ToolbarButton
                    disabled={submitting}
                    label="Italic"
                    onMouseDown={preserveSelection}
                    onClick={() => exec("italic")}
                  >
                    <span className="font-serif italic">I</span>
                  </ToolbarButton>
                  <ToolbarButton
                    disabled={submitting}
                    label="Inline code"
                    onMouseDown={preserveSelection}
                    onClick={() => wrapSelectionInCode()}
                  >
                    <CodeIcon />
                  </ToolbarButton>
                  <ToolbarButton
                    disabled={submitting}
                    label="Link"
                    onMouseDown={preserveSelection}
                    onClick={() => insertLink()}
                  >
                    <LinkIcon />
                  </ToolbarButton>
                  <ToolbarDivider />
                  <ToolbarButton
                    disabled={submitting}
                    label="Bulleted list"
                    onMouseDown={preserveSelection}
                    onClick={() => exec("insertUnorderedList")}
                  >
                    <UnorderedListIcon />
                  </ToolbarButton>
                  <ToolbarButton
                    disabled={submitting}
                    label="Numbered list"
                    onMouseDown={preserveSelection}
                    onClick={() => exec("insertOrderedList")}
                  >
                    <OrderedListIcon />
                  </ToolbarButton>
                  <ToolbarDivider />
                  <ToolbarButton
                    disabled={submitting}
                    label="Undo"
                    onMouseDown={preserveSelection}
                    onClick={() => exec("undo")}
                  >
                    <UndoIcon />
                  </ToolbarButton>
                  <ToolbarButton
                    disabled={submitting}
                    label="Redo"
                    onMouseDown={preserveSelection}
                    onClick={() => exec("redo")}
                  >
                    <RedoIcon />
                  </ToolbarButton>
                </div>

                <div className="relative">
                  {isEmpty ? (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-3 left-3 text-sm text-[var(--color-ink-500)]"
                    >
                      Write your answer...
                    </span>
                  ) : null}
                  <div
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={error ? "true" : undefined}
                    aria-label="Answer"
                    aria-multiline="true"
                    className="block min-h-44 w-full bg-transparent px-3 py-3 text-sm leading-relaxed text-[var(--color-ink-900)] focus:outline-none [&_a]:text-[var(--color-link)] [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded-sm [&_code]:border [&_code]:border-[var(--color-border-default)] [&_code]:bg-[var(--color-ink-50)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                    contentEditable={!submitting}
                    id={editorId}
                    onInput={() => syncEmpty()}
                    ref={editorRef}
                    role="textbox"
                    spellCheck
                    suppressContentEditableWarning
                  />
                </div>
              </div>

              {error ? (
                <p
                  className="mt-2 text-sm font-medium text-[var(--color-state-danger)]"
                  id={errorId}
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-4 flex items-center gap-3">
                <Button className="px-5" disabled={submitting} type="submit">
                  {submitting ? "Posting…" : "Post Answer"}
                </Button>
                <button
                  className="text-sm text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
                  disabled={submitting}
                  onClick={closeModal}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ToolbarButton({
  children,
  disabled,
  label,
  onClick,
  onMouseDown,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  onMouseDown?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-ink-700)] transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      onMouseDown={onMouseDown}
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

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Walk the contentEditable DOM and emit GitHub-flavored markdown that round-
 * trips back through `<Markdown />`. Handles bold/italic/code/links/lists,
 * normalizes <div>/<p> as paragraph breaks and <br> as soft newlines.
 */
function htmlToMarkdown(root: HTMLElement): string {
  return walk(root)
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function walk(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "br":
      return "\n";
    case "strong":
    case "b": {
      const inner = childMd(el);
      return inner ? `**${inner}**` : "";
    }
    case "em":
    case "i": {
      const inner = childMd(el);
      return inner ? `*${inner}*` : "";
    }
    case "code": {
      const inner = childMd(el);
      return inner ? `\`${inner}\`` : "";
    }
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const text = childMd(el);
      if (!href) return text;
      if (text === href) return href;
      return `[${text}](${href})`;
    }
    case "ul":
      return renderList(el, false);
    case "ol":
      return renderList(el, true);
    case "li":
      // Should normally be handled by ul/ol parent. Fallback emits a bullet.
      return `- ${childMd(el).trim()}\n`;
    case "p":
    case "div": {
      const inner = childMd(el).replace(/\s+$/g, "");
      if (!inner) return "\n";
      return `${inner}\n\n`;
    }
    default:
      return childMd(el);
  }
}

function childMd(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((child) => {
    out += walk(child);
  });
  return out;
}

function renderList(el: HTMLElement, ordered: boolean): string {
  const items = Array.from(el.children).filter(
    (child) => child.tagName.toLowerCase() === "li",
  );
  let out = "";
  items.forEach((item, index) => {
    const prefix = ordered ? `${index + 1}. ` : "- ";
    const body = childMd(item as HTMLElement)
      .replace(/^\s+|\s+$/g, "")
      .replace(/\n+/g, " ");
    out += `${prefix}${body}\n`;
  });
  return `${out}\n`;
}

export default AnswerComposer;
