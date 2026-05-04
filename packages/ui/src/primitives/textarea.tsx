import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Square multi-line text input. Same border / focus treatment as `Input`.
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "block w-full",
          "px-3 py-2",
          "border border-[var(--color-border-default)]",
          "bg-[var(--color-surface-base)] text-[var(--color-ink-900)]",
          "placeholder:text-[var(--color-ink-300)]",
          "rounded-none",
          "text-sm leading-relaxed",
          "transition-colors duration-150 ease-out",
          "focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-inset",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-ink-50)] disabled:text-[var(--color-ink-500)]",
          "resize-y",
          className,
        )}
        {...props}
      />
    );
  },
);

export default Textarea;
