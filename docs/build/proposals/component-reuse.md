# Audit A3 — Frontend Component Reuse

Audit of `packages/ui/src/primitives/` against `apps/web/frontend/features/**/components/**`.

Date: 2026-05-04. Branch: `main`. Companion to `docs/build/tasks/build-2/A3-component-reuse.md`.

## Inventory

Usage count for each export of `packages/ui/src/primitives/index.ts` across `apps/web` (before this audit).

| Primitive        | Usages | Notes                                                                                                                                                       |
| ---------------- | -----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`         |      0 | Hand-rolled in 6+ places. Now used in `ask-form`, `answer-composer`.                                                                                        |
| `buttonVariants` |      0 | New export. Now used in `question-feed`, `top-command-bar`, `message-list`, `ask-form` (Cancel Link).                                                       |
| `Badge`          |      0 | No imports anywhere. Inline `<span>` look-alikes in 4 spots — see "Left as-is".                                                                             |
| `Tag`            |      0 | Alias of `Badge`. Same status.                                                                                                                              |
| `Surface`        |      0 | No imports. Card frames are written inline in `question-feed`, `question-detail`, `answer-list`, `answer-composer`, `side-rail` — left for now (see below). |
| `Input`          |      0 | No imports. Three inline `<input>` patterns survive (ask-form title, top-bar search, settings-form).                                                        |
| `Textarea`       |      0 | No imports. Editor textareas in `ask-form`, `prompt-input` are wrapped in a custom toolbar container — different shape, left as-is.                         |
| `IconButton`     |      0 | No imports. `ToolbarButton` helpers in `ask-form` + `answer-composer` are 7×7 ghost variants, slightly smaller.                                             |
| `Divider`        |      0 | No imports. One inline `<hr>`-like span in `topic-rail`.                                                                                                    |
| `Pill`           |      0 | No imports. `citation-bubble` and `related-questions` use inline kind-badges instead.                                                                       |

`cn` from `@cardinalxchange/ui` is the only pre-audit consumer (5 imports across `shell`, `cxc-ai`, `chat-history-rail`, `tool-chain`, `prompt-input`).

## Replacements

Inline JSX swapped for a primitive (or `buttonVariants`). All eight match shape variant-for-variant against the existing primitive after the rounded-\* → rounded-none alignment that was already encoded in `Button`.

| File                                                                          | Before                                                                                                 | After                                                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `apps/web/frontend/features/ask/components/ask-form.tsx:475-481`              | inline `<button class="...rounded-md...bg-cardinal-500...">Submit Question</button>`                   | `<Button disabled={submitting} type="submit">…</Button>`                                 |
| `apps/web/frontend/features/ask/components/ask-form.tsx:468-474`              | inline `<Link class="...rounded-md border bg-surface-base...">Cancel</Link>`                           | `<Link className={buttonVariants({ variant: "secondary" })}>…</Link>`                    |
| `apps/web/frontend/features/questions/components/answer-composer.tsx:300-307` | inline `<button class="...rounded-md...bg-cardinal-500...px-5">Post Answer</button>`                   | `<Button className="px-5" disabled={submitting} type="submit">…</Button>`                |
| `apps/web/frontend/features/shell/components/top-command-bar.tsx:54-60`       | inline `<Link class="...rounded-lg...bg-cardinal-500...px-5">Ask Question</Link>`                      | `<Link className={cn(buttonVariants({ variant: "primary" }), "shrink-0 px-5")}>…</Link>` |
| `apps/web/frontend/features/questions/components/question-feed.tsx:86-95`     | inline `<Link class="...rounded-md...bg-cardinal-500...">Ask a Question</Link>` (filtered empty state) | `<Link className={buttonVariants({ variant: "primary" })}>…</Link>`                      |
| `apps/web/frontend/features/questions/components/question-feed.tsx:96-101`    | inline `<Link class="...rounded-md border...">Clear filter</Link>`                                     | `<Link className={buttonVariants({ variant: "secondary" })}>…</Link>`                    |
| `apps/web/frontend/features/questions/components/question-feed.tsx:113-118`   | inline `<Link class="mt-6 ...rounded-md...bg-cardinal-500...">Ask a Question</Link>` (DB-empty state)  | `<Link className={cn("mt-6", buttonVariants({ variant: "primary" }))}>…</Link>`          |
| `apps/web/frontend/features/cxc-ai/components/message-list.tsx:144-149`       | inline `<Link class="...rounded-md...bg-cardinal-500...text-xs">Use this draft</Link>`                 | `<Link className={buttonVariants({ variant: "primary", size: "sm" })}>…</Link>`          |

The visible delta is `rounded-md` → `rounded-none` and (in three sites) `h-9` → `h-10`. Both align with the spec encoded in `Button` itself ("Square-cornered command primitive"). Visual QA on `/questions`, `/ask`, `/cxc-ai`, and `/login` after the swap confirms nothing else moved.

## Promotions

One: `buttonVariants` is now exported from `packages/ui/src/primitives/button.tsx` and re-exported through `packages/ui/src/primitives/index.ts`.

**Justification.** A primitive button rendered as a Next `<Link>` (so the navigation cancels server work + warms the destination) was hand-rolled in **four** features:

- `shell/top-command-bar` — Ask Question CTA
- `questions/question-feed` — three CTAs in the empty-state branches
- `cxc-ai/message-list` — Use this draft
- `ask/ask-form` — Cancel link

This crosses the 3+ feature threshold from `STRUCTURE.md`. Exporting the cva config (no new component, no new dependency) is the minimum viable lift and avoids a `LinkButton` wrapper that would have to depend on `next/link`. Consumers compose with `cn(buttonVariants({…}), "extra")` when they need overrides.

No new component primitives were promoted: every inline pattern below the threshold or with shape divergence was left in place.

## Left as-is with reason

Inline patterns considered and **not** lifted, with rationale.

| Pattern                                                                           | Sites                                                                                                                                  | Reason                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth forms** (login, settings) — primary buttons + inputs                       | `auth/login-form.tsx`, `auth/settings-form.tsx`                                                                                        | Brief explicitly excludes auth ("flagged but not refactored this round"). They use `rounded-lg` / `h-11` and an SSO disabled-state variant the primitive doesn't expose. Pick up after auth design lands.                          |
| **Inline tag chip** (rounded-md border ink-50)                                    | `question-row.tsx:35-42`, `question-detail.tsx:27-34`, `ask-form.tsx:421-435`, `message-list.tsx:135-141`                              | 4 sites, but shape diverges from `Badge` (rounded-md vs rounded-none, padding/text-size differ). Promoting needs a "tag-link" sub-variant of `Badge` plus the in-chip "remove" button used by `ask-form`. Tracked under API drift. |
| **`ToolbarButton`** (h-7×7 ghost button with focus ring)                          | `ask-form.tsx`, `answer-composer.tsx`                                                                                                  | Two feature copies — below 3+ threshold. Smaller (h-7 vs `IconButton` h-8) and tied to `contentEditable`/textarea selection logic. Leave.                                                                                          |
| **Editor textarea wrapped in toolbar container** (no own border)                  | `ask-form.tsx:381-399`, `answer-composer.tsx:270-285`, `prompt-input.tsx:115-124`                                                      | Shape doesn't match `Textarea` primitive (which has its own 1px border). All three intentionally render the border on the wrapper so the toolbar shares it. Leave.                                                                 |
| **Search input with leading icon** (h-10 rounded-lg pl-9)                         | `top-command-bar.tsx:123-133`, `top-command-bar.tsx:144-153` (suspense fallback)                                                       | Single feature, two copies (live + fallback). `Input` primitive doesn't expose a leading-icon slot. Below threshold.                                                                                                               |
| **Card frame** (`rounded-lg border bg-surface-base p-4/p-6`)                      | `side-rail.tsx`, `question-feed.tsx`, `question-detail.tsx`, `answer-list.tsx`, `answer-composer.tsx`, `chat-shell.tsx` (error banner) | 6 sites — far above threshold for a `Surface` lift. Held for next round: every site uses `rounded-lg` while `Surface` is `rounded-none`. A4's token round may rationalize radii first; lifting now would conflict.                 |
| **Citation chip** + **Source kind badge** (rounded-md / rounded-sm bordered chip) | `citation-bubble.tsx`, `related-questions.tsx`, `tool-chain.tsx` (status pill), `message-list.tsx` (draft-tag)                         | 4 sites with three distinct widths/heights. `Pill` is close in shape but its bg/border defaults don't cover the cardinal-on-hover behaviour of `citation-bubble`. Hold.                                                            |
| **Scroll-to-bottom 9×9 icon button**                                              | `chat-shell.tsx:97-105`                                                                                                                | Single site. Below threshold.                                                                                                                                                                                                      |
| **User-menu avatar button** (h-9 w-9 rounded-full)                                | `user-menu.tsx:65-81`                                                                                                                  | Single site. Round shape — explicitly off-spec for the rest of the system. Likely intentional for avatars. Leave.                                                                                                                  |

## API drift

Where the existing primitives' prop API is misaligned with how features actually need to render.

1. **`Button` has no error/danger variant.** `auth/settings-form` "Delete my account" is `bg-cardinal-600` (deeper red) with `hover:bg-cardinal-700`. Same shape, different chroma. _Fix_: add `variant: "danger"` once auth picks up the primitive. Two-line cva block.

2. **`Input` has no error state.** `ask-form` swaps `border-default` → `border-state-danger` and the focus ring colour when `aria-invalid`. The pattern repeats in `answer-composer`'s contentEditable wrapper. _Fix_: add `state?: "default" | "error"` to `InputProps`, route the same boolean down. Below threshold today (2 sites).

3. **`Button` size grid is `h-8 / h-10 / h-12`, but features want `h-9` and `h-11`.** Today every feature that wanted `h-9` sits at `h-10` after the swap (4px taller). Acceptable per visual QA. If `h-9` is wanted as the canonical secondary-row size, add `size: "compact"` rather than padding-tweaking at every call site.

4. **`Button` does not accept `as`/`asChild`.** Solved this round by exporting `buttonVariants` so a `<Link>` can borrow the classes. If a third element shape (e.g. `<a target="_blank">` for external links) appears, revisit — but `asChild` would require a Slot dep, which the brief forbids.

5. **`Surface` is `rounded-none`; every consumer wants `rounded-lg`.** The primitive matches the spec; the consumers are drift. Promote-or-fix decision belongs to A4 once token rationalisation lands.

6. **No `cn` re-export from `packages/ui`** that scopes to feature folders. Already exported — but the auth/feature components don't yet import it. Not blocking.

## Shipping plan summary

- ✅ Commit `1914adb` — `refactor(ui): export buttonVariants for Link-as-button consumers`.
- ✅ Commit `a5c4136` — `refactor(ui): replace inline buttons with <Button> + buttonVariants` (5 files, 8 sites).
- ⏭ Next round (post-A4 token landing): `Surface` lift, error-state `Input`, `danger` `Button` variant, tag-link `Badge` sub-variant.
