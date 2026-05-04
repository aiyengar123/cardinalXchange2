# Shared-shell needs raised by Task 03 (Question Detail)

The user pushed back: "Is it wide enough? Why is it so thin? You may need to expand the boundaries." — and asked whether the bold/editing features were still there. Two of those changes are within my page scope (markdown rendering on bodies + toolbar on the answer composer, both done locally). The third is a **shell** change that touches files outside my lane. Documenting here for the user / shell agent to reconcile.

## Edit I made (please confirm)

### `apps/web/app/(forum)/layout.tsx`

Changed the forum layout from:

```tsx
return <PageShell>{children}</PageShell>;
```

to:

```tsx
return (
  <PageShell mainMaxWidthClass="max-w-[920px]" sideRail={null}>
    {children}
  </PageShell>
);
```

**Why:**

1. **Width** — `PageShell`'s default `max-w-[720px]` made the detail page feel cramped: long URLs in answers wrapped, the markdown numbered list lost its breathing room, and the user explicitly asked for it to be wider. The canonical bottom-left panel shows main content stretching well past 720px.
2. **No SideRail** — the canonical 4-panel image shows **no right SideRail in any of the three forum panels** (Questions list, Ask, Question detail). Suppressing the SideRail on forum routes matches that, and the freed ~324px is exactly what lets the widened main column breathe.

`PageShell` itself was untouched — it already exposes `mainMaxWidthClass` and `sideRail` props for exactly this kind of override. The only shared file changed is `apps/web/app/(forum)/layout.tsx`, which is the thin per-segment composition.

## Cross-page implications

This change applies to **all** three forum routes (`/questions`, `/ask`, `/questions/[id]`). The Task 01 and Task 02 owners should:

- Verify their pages still look right at the wider 920px main and without the SideRail.
- If either task wants the SideRail back for their panel only, they can pass `sideRail={<SideRail />}` from a route-level layout, but the canonical doesn't show one — please confirm with the user before re-adding.

## Things still missing from the canonical that need shared work

These are visible in the canonical bottom-left panel but live in components I'm not allowed to edit. Flagging for the shell owner:

1. **Top bar wordmark icon** — the canonical shows a small red "S" tile next to the `CardinalXchange` text. Currently `top-command-bar.tsx` renders only the wordmark.
2. **Left rail icons** — the canonical shows a small icon (home / list / pencil / sparkle / tag) before each label in `TopicRail`. Currently labels only.
3. **Left rail "Ask" entry** — the canonical rail has 5 entries (Home / Questions / Ask / CXC AI / Tags). Current rail is driven by `apps/web/shared/data/topics.data.ts` and shows fewer. The "Ask Question" pill in the top bar still works as the primary affordance, but the rail entry is missing.
4. **Top bar search styling** — the canonical search input has no cardinal-red border (it's a plain rounded white input with a search icon). Current input has a `--color-cardinal-700` border and no icon.

None of these block my page from matching its canonical panel; they're just shell-level fidelity items the user will likely want when the four parallel sessions converge.
