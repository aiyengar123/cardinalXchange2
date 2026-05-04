"use client";

import { useCallback, useState, type FormEvent, type KeyboardEvent } from "react";

type MessageComposerProps = {
  busy: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
};

/**
 * Text + Send composer for the CXC AI chat. Square corners, 2px cardinal-red
 * focus ring on the textarea, primary cardinal button. Press Enter to send;
 * Shift+Enter inserts a newline.
 */
export function MessageComposer({ busy, onSend, onStop }: MessageComposerProps) {
  const [value, setValue] = useState("");

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    onSend(trimmed);
    setValue("");
  }, [busy, onSend, value]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
    [submit],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <form
      aria-label="Send a message to CXC AI"
      className="flex flex-col gap-2 border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="cxc-ai-input">
        Message
      </label>
      <textarea
        className="block min-h-20 w-full resize-none border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 py-2 text-sm leading-relaxed text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-border-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-ink-50)]"
        disabled={busy}
        id="cxc-ai-input"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about Stanford. CXC AI cites public Q&A when it can."
        rows={3}
        value={value}
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-[var(--color-ink-500)]">
          Press Enter to send · Shift + Enter for a new line.
        </p>
        <div className="flex items-center gap-2">
          {busy && onStop ? (
            <button
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] px-3 text-xs font-semibold text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
              onClick={onStop}
              type="button"
            >
              Stop
            </button>
          ) : null}
          <button
            className="inline-flex h-9 items-center justify-center rounded-md border border-transparent bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[var(--color-border-default)] disabled:bg-[var(--color-ink-100)] disabled:text-[var(--color-ink-500)]"
            disabled={busy || !value.trim()}
            type="submit"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}

export default MessageComposer;
