import * as React from "react";

import { cn } from "../utils/cn";

/**
 * Square text input. 1px ink-100 border by default; on focus the outline
 * thickens to a 2px cardinal-red ring (no shadow).
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "block w-full",
          "h-10 px-3",
          "border border-[var(--color-border-default)]",
          "bg-[var(--color-surface-base)] text-[var(--color-ink-900)]",
          "placeholder:text-[var(--color-ink-300)]",
          "rounded-none",
          "text-sm",
          "transition-colors duration-150 ease-out",
          "focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-inset",
          "disabled:cursor-not-allowed disabled:bg-[var(--color-ink-50)] disabled:text-[var(--color-ink-500)]",
          className,
        )}
        {...props}
      />
    );
  },
);

export default Input;
