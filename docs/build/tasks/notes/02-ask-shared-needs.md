# Task 02 — Shared shell deltas

All previously flagged shared-shell items have shipped:

- White top bar with cardinal-red `S` mark + cardinal-red wordmark.
- Magnifying-glass search icon, brighter cardinal red (`#C8102E`).
- 5-item rail (Home / Questions / Ask / CXC AI / Tags) with icons, sticky
  positioning, and visible section dividers; `Ask` highlights on `/ask`.
- No right `SideRail` on forum routes.
- Inter is the only font.
- Forum container is `mx-auto max-w-[1600px] px-4 sm:px-6` with
  `mainMaxWidthClass="max-w-none"` so whitespace flows symmetrically outside
  the content on wide viewports — Stack Overflow style.
- Tailwind v4 spacing + border-radius regressions fixed (gap/m/p/space and
  rounded-* utilities now produce CSS).

No outstanding shared-shell asks from `/ask`.
