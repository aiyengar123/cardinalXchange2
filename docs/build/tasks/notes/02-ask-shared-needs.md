# Task 02 — Shared shell deltas (out of my scope)

## Resolved by coordinator

The earlier deltas in this file (logo `S` badge, search placeholder, rail
items + active state, removal of right SideRail, brighter cardinal red,
single-Inter font stack) have all shipped on the shared shell.

## New: top-bar wordmark vs rail horizontal alignment

After switching the `(forum)` route layout to `containerClassName="mr-auto
max-w-[1600px] pl-6 sm:pl-12"` (matching `/cxc-ai`'s left-anchored row), the
left rail now starts at `pl-12` from the viewport edge — which matches the
Stack Overflow whitespace gap the user asked for.

`TopCommandBar` still uses its own `mx-auto max-w-[1264px]` container, so at
wide viewports (1440+) the cardinal-red `S` wordmark sits a little to the
right of the rail underneath it, while the rail anchors hard left. To keep
the top bar and the rail vertically aligned at every viewport, the top bar
needs the same left-anchored container constraints as the forum / cxc-ai
row.

Suggested change (shared shell — `apps/web/features/shell/components/top-command-bar.tsx`):

```tsx
<div className="mr-auto flex max-w-[1600px] flex-col gap-2 pl-6 pr-4 py-3 sm:flex-row sm:h-[68px] sm:items-center sm:gap-4 sm:py-0 sm:pl-12 sm:pr-6">
```

The `/cxc-ai` route already exhibits the same misalignment under the current
shell, so a fix here will benefit both forum and cxc-ai routes.
