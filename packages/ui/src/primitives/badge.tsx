import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/**
 * Square 1px-bordered label. Used for question tags and lightweight status
 * markers. `Tag` is exported as an alias of this component because the spec
 * collapses them into a single shape.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center",
    "border",
    "px-2 py-0.5",
    "text-xs font-medium leading-none",
    "rounded-none",
    "min-h-5",
  ].join(" "),
  {
    variants: {
      tone: {
        neutral: [
          "border-[var(--color-border-default)]",
          "bg-[var(--color-surface-base)]",
          "text-[var(--color-ink-700)]",
        ].join(" "),
        accent: [
          "border-[var(--color-cardinal-500)]",
          "bg-[var(--color-surface-base)]",
          "text-[var(--color-cardinal-500)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type BadgeTone = NonNullable<
  VariantProps<typeof badgeVariants>["tone"]
>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}

export default Badge;
