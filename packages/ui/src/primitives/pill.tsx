import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/**
 * Square label used for AI source attributions in the CXC AI panel. Despite
 * the name, this is a flat 1px-bordered chip — no curves.
 */
const pillVariants = cva(
  [
    "inline-flex items-center gap-1",
    "border border-[var(--color-border-default)]",
    "bg-[var(--color-surface-sunk)] text-[var(--color-ink-700)]",
    "px-2 py-0.5",
    "text-xs font-medium leading-none",
    "rounded-none",
  ].join(" "),
  {
    variants: {
      tone: {
        neutral: "",
        accent:
          "border-[var(--color-cardinal-500)] text-[var(--color-cardinal-500)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type PillTone = NonNullable<VariantProps<typeof pillVariants>["tone"]>;

export interface PillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof pillVariants> {}

export function Pill({ className, tone, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone }), className)} {...props} />;
}

export default Pill;
