"use client";

import { ArrowUp, Loader2, Square, X, type LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@cardinalxchange/ui";

type PromptInputStatus = "ready" | "submitted" | "streaming" | "error";

type PromptInputProps = {
  status: PromptInputStatus;
  onSend: (text: string) => void;
  onStop?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

const MAX_HEIGHT_PX = 192;

export function PromptInput({
  status,
  onSend,
  onStop,
  placeholder,
  autoFocus,
  className,
}: PromptInputProps) {
  const [value, setValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setValue(event.target.value);
      resize();
    },
    [resize],
  );

  const submit = useCallback(() => {
    if (status === "streaming" && onStop) {
      onStop();
      return;
    }
    if (status !== "ready") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
    }
  }, [onSend, onStop, status, value]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit();
      }
    },
    [submit],
  );

  const trimmedEmpty = value.trim().length === 0;
  const disabled =
    status === "submitted" || (status === "ready" && trimmedEmpty);

  let Icon: LucideIcon;
  let iconClassName: string | undefined;
  let ariaLabel: string;
  if (status === "submitted") {
    Icon = Loader2;
    iconClassName = "animate-spin";
    ariaLabel = "Sending";
  } else if (status === "streaming") {
    Icon = Square;
    ariaLabel = "Stop generating";
  } else if (status === "error") {
    Icon = X;
    ariaLabel = "Retry";
  } else {
    Icon = ArrowUp;
    ariaLabel = "Send message";
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-[var(--color-border-default)] bg-[var(--color-surface-base)] focus-within:border-[var(--color-border-focus)]",
        className,
      )}
    >
      <textarea
        aria-label="Message"
        className="min-h-12 max-h-48 w-full resize-none border-0 bg-transparent px-3 py-3 text-sm leading-relaxed text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-300)] focus:outline-none"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={value}
      />
      <div className="flex items-center justify-between px-3 pb-2 pt-0 text-[11px] text-[var(--color-ink-500)]">
        <span>Enter to send · Shift+Enter for newline</span>
        <button
          aria-label={ariaLabel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-cardinal-500)] text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[var(--color-ink-100)] disabled:text-[var(--color-ink-500)]"
          disabled={disabled}
          onClick={submit}
          type="button"
        >
          <Icon aria-hidden className={cn("h-4 w-4", iconClassName)} />
        </button>
      </div>
    </div>
  );
}
