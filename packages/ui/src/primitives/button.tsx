import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/**
 * Square-cornered command primitive. Cardinal-red is the only chromatic accent
 * (used by `primary`); `secondary` and `ghost` stay neutral.
 *
 * `buttonVariants` is exported so consumers that need button styling on a
 * non-`<button>` element (e.g. a Next `<Link>` for a primary CTA that
 * navigates) can apply the same classes without re-deriving them.
 */
export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium",
    "border",
    "transition-colors duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "rounded-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "border-transparent",
          "bg-[var(--color-cardinal-500)] text-white",
          "hover:bg-[var(--color-cardinal-600)]",
          "active:bg-[var(--color-cardinal-700)]",
        ].join(" "),
        secondary: [
          "bg-[var(--color-surface-base)] text-[var(--color-ink-900)]",
          "border-[var(--color-border-default)]",
          "hover:border-[var(--color-border-strong)] hover:bg-[var(--color-ink-50)]",
        ].join(" "),
        ghost: [
          "border-transparent",
          "bg-transparent text-[var(--color-ink-700)]",
          "hover:bg-[var(--color-ink-50)] hover:text-[var(--color-ink-900)]",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>["variant"]
>;
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>["size"]
>;

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export default Button;
