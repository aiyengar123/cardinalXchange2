# 01 — Questions: shared-shell deltas vs canonical

The local /questions content matches the top-left panel of the canonical
image. The remaining differences are all in shared-shell components
(`apps/web/frontend/features/shell/...`) which task 01 cannot edit. Listed here so
the user can reconcile.

## TopCommandBar (`features/shell/components/top-command-bar.tsx`)

1. **Missing logo mark.** Canonical shows a small red "S" square (~28px)
   to the left of the `CardinalXchange` wordmark. Current build has the
   wordmark only.
2. **Search placeholder copy.** Currently
   `Search questions, tags, and answers`; canonical reads
   `Search questions and tags`.
3. **Search trailing icon.** Canonical shows a magnifier glyph at the
   right edge of the search input. Current input is plain text only.

## TopicRail (`frontend/features/shell/components/topic-rail.tsx` + `apps/web/shared/data/topics.data.ts`)

1. **Rail order and entries.** Canonical order is
   `Home / Questions / Ask / CXC AI / Tags`. Current `railTopics` is
   `Home / Questions / Tags / CXC AI` — missing `Ask` and putting
   `Tags` ahead of `CXC AI`.
2. **Icons.** Each rail item in the canonical has a leading icon:
   house (Home), bullet-list (Questions), pencil (Ask), chat-bubble
   in cardinal-red (CXC AI), tag (Tags). Current rail is text-only.
3. **Active state**: current "Questions" active treatment (3px
   cardinal-left bar + ink-50 bg + bold) reads correctly against the
   canonical. No change needed once icons land.

## SideRail visibility

Canonical top-left panel does not show the right SideRail because the
panel is rendered narrower than the `xl:block` breakpoint. At our
1280px QA viewport the SideRail does render — that is correct behaviour
for a desktop user, just absent from the cropped panel.
