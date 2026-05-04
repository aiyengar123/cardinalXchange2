import * as React from "react";

import { cn } from "../utils/cn";

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: "horizontal" | "vertical";
}

/**
 * 1px ink-100 line. Used to separate sections without introducing color.
 */
export function Divider({
  className,
  orientation = "horizontal",
  role = "separator",
  ...props
}: DividerProps) {
  return (
    <hr
      role={role}
      aria-orientation={orientation}
      className={cn(
        "m-0 border-0 bg-[var(--color-ink-100)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export default Divider;
