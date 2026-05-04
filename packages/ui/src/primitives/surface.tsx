import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";

/**
 * Square card surface. `border before shadow` — separation comes from a 1px
 * border, never a drop shadow on body content.
 */
const surfaceVariants = cva(
  [
    "border border-[var(--color-border-default)]",
    "rounded-none",
  ].join(" "),
  {
    variants: {
      variant: {
        base: "bg-[var(--color-surface-base)]",
        sunk: "bg-[var(--color-surface-sunk)]",
      },
    },
    defaultVariants: {
      variant: "base",
    },
  },
);

export type SurfaceVariant = NonNullable<
  VariantProps<typeof surfaceVariants>["variant"]
>;

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export function Surface({ className, variant, ...props }: SurfaceProps) {
  return (
    <div className={cn(surfaceVariants({ variant }), className)} {...props} />
  );
}

export default Surface;
