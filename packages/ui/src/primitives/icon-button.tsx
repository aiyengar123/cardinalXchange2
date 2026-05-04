import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/**
 * Square 32x32 icon button. Use for header chrome and inline row actions.
 */
const iconButtonVariants = cva(
  [
    "inline-flex h-8 w-8 items-center justify-center",
    "border",
    "rounded-none",
    "transition-colors duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "border-[var(--color-border-default)]",
          "bg-[var(--color-surface-base)] text-[var(--color-ink-700)]",
          "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)]",
        ].join(" "),
        ghost: [
          "border-transparent",
          "bg-transparent text-[var(--color-ink-700)]",
          "hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type IconButtonVariant = NonNullable<
  VariantProps<typeof iconButtonVariants>["variant"]
>;

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Required for accessibility. */
  "aria-label": string;
}

export function IconButton({
  className,
  variant,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(iconButtonVariants({ variant }), className)}
      {...props}
    />
  );
}

export default IconButton;
