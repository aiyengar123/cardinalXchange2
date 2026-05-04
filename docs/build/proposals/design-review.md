# Design Review (Wave 4)

Live visual QA of `localhost:3000` against the canonical 2x2 panel image,
`docs/build/04-design.md` (with the rounded-md softening), `docs/build/03-frontend.md`,
and `docs/build/proposals/cxc-ai-rail-implementation.md`. DB is empty, so all
findings cover the empty-state surface area only.

Viewports tested: 1600x1000 (wide), 1440x900 (default), 1024x800 (lg edge),
900x1100 (tablet), 390x844 (mobile).

---

## 1. TL;DR

Overall the build matches the canonical image's mood — Stanford cardinal red,
serif title, square structural surfaces, dense rails. Body of the work is solid
and on-brand. Three issues are real ship blockers: (a) the top-bar search is
unusable on mobile (collapses to ~40px wide), (b) every route loses navigation
in the 768-1023 tablet band because both rails hide and there is no mobile menu,
(c) the filtered empty state on `/questions?tag=…` reuses the unfiltered
"No questions yet" copy and a generic CTA, so the user has no way to tell the
filter found zero matches versus the DB being empty.

Verdict: **ship after polish.** None of the blockers require redesign —
they're scope/responsive holes. The remaining issues are alignment, copy, and
button consistency.

---

## 2. Findings

| # | Route(s) | Element | Severity | Issue | Fix | Screenshot |
|---|---|---|---|---|---|---|
| F1 | all | `TopCommandBar` search input | **block** | At 390px the search box is roughly 40px wide and shows only "Sea". Wordmark + Ask Question button consume the entire row. Search is the primary navigation affordance and is effectively missing on mobile. | At `<sm` either (a) drop the search to a second row under the wordmark + CTA, or (b) hide the search and show a search icon button that expands. Keep it square / rounded-md per the existing input. | `/tmp/dr-questions-390.png` |
| F2 | all | shell layout 768-1023px | **block** | At 900px both `TopicRail` (`lg:block`) and `SideRail` (`xl:block`) are display:none. Main is the only child of the shell flex but is capped at `max-w-[720px]` and left-justified inside the 1264px container, leaving a wide empty band on the right. There is also no nav at all, so a user on a tablet cannot reach `/questions`, `/cxc-ai`, or `/ask` except via the top-bar search/CTA. | Either (a) reveal `TopicRail` at `md:` (768px) and only hide it at `<md`, or (b) add a horizontal nav row under the top bar that shows on `md:` and below to mirror the rail items. Also center main when no rail is rendered (drop `max-w-[720px]` or wrap in `mx-auto`). | `/tmp/dr-questions-900.png`, `/tmp/dr-cxcai-900.png` |
| F3 | `/questions?tag=advising`, `?sort=*` | `QuestionFeedEmptyState` | **block** | Filtered empty state is identical to the unfiltered one: "No questions yet. Be the first — Ask a Question." The title-area subline does say "Filtered by tag advising. Clear", but the empty card itself is wrong copy for a no-match case and the CTA "Ask a Question" pre-fills nothing. | When `tag` or `query` is set and `questions.length === 0`, render a different empty state: e.g. "No questions tagged `advising` yet." with a secondary "Clear filter" link and the primary "Ask a Question" CTA optionally pre-filling the tag. Pass a `filter` prop into `QuestionFeed` from `app/(forum)/questions/page.tsx`. | `/tmp/dr-questions-tag-advising-1440.png` |
| F4 | all | shell column top alignment | **polish** | TopicRail first item top = 81px, SideRail first card top = 73px, main h1 top = 113px (measured at 1440x900). Three different starting Y positions. SideRail uses `py-4`, TopicRail uses `py-6`, main uses `py-6` on top of `py-8` inside `app/(forum)/questions/page.tsx`. The column heads do not visually agree. | Normalize the three top paddings: pick one (`py-6` is a good default), drop the inner `py-8` on the questions page wrapper, and let the rail item top align with the page title baseline (or 8-12px above it). Same scope for `apps/web/features/cxc-ai/components/chat-shell.tsx` which also has its own `py-6`. | n/a (measured via JS) |
| F5 | `/`, all forum | `QuestionFeedEmptyState` "Ask a Question" CTA | **polish** | Two primary CTAs labelled "Ask Question" / "Ask a Question" disagree in shape: the top-bar one is `rounded-md`, white-on-cardinal-red-bg with `h-9`; the empty-state one is square (no rounded class), cardinal-red bg with `h-10`. Per the softened rule, primary buttons should consistently use `rounded-md`. | In `apps/web/features/questions/components/question-feed.tsx` add `rounded-md` to the empty-state button and consider matching height (`h-9`). Also unify label casing to "Ask a Question" everywhere, or "Ask Question" everywhere. | `/tmp/dr-questions-1440-fold.png` |
| F6 | `/cxc-ai`, `/cxc-ai/[chatId]` | duplicate "New chat" buttons | **polish** | Two "New chat" affordances render simultaneously: one in the chat-history rail (h-11, text-sm, rounded-md), one in the chat header (h-9, text-xs, square, no rounded). They link to the same `/cxc-ai`. Visually inconsistent and redundant — once you have the rail, the header button is noise. | Drop the chat-shell header `<Link href="/cxc-ai">New chat</Link>` (lines 69-74 of `chat-shell.tsx`). The rail button is the canonical entry. If you keep both, make the header version `rounded-md` and `h-9 text-sm` to match the search/Ask/filter-tab system. | `/tmp/dr-cxcai-1440-full.png` |
| F7 | `/ask` | error state | **polish** | Submitting empty surfaces "Title is required." in cardinal red below the Tags row, but the empty Title input gets no red border and no `aria-invalid` styling. The viewer has to read the message and find which field is wrong. The error message also sits below the Tags input visually attached to nothing. | Add `aria-invalid` + a 1px `state.danger` border to the offending input. Move the inline error message immediately under its field, not at the form bottom. Use `apps/web/features/ask/components/ask-form.tsx`. | `/tmp/dr-ask-empty-submit.png` |
| F8 | `/cxc-ai` | `MessageComposer` Send button | **polish** | Send is square (no rounded class), cardinal-red bg, `h-9`. The disabled state uses `opacity-50` which on cardinal red reads as a faded pink that looks broken on first glance ("did the page fail to load?"). Also inconsistent with the rounded-md primary button rule. | Add `rounded-md` to the Send button. Replace `disabled:opacity-50` with `disabled:bg-[var(--color-ink-300)]` (or similar neutral) so disabled does not look like a desaturated brand color. File: `apps/web/features/cxc-ai/components/message-composer.tsx`. | `/tmp/dr-cxcai-1440-fold.png`, `/tmp/dr-cxcai-390.png` |
| F9 | rail item "Tags" | `topics.data.ts` | **polish** | The Tags rail item links to `/questions#tags`, which lands on `/questions` and tries to scroll to `id="tags"` — that anchor does not exist, so the click is a no-op visually. The user clicks "Tags" expecting a tag index and gets identical-looking page. | Either (a) build a real `/tags` index route, (b) point `Tags` at `/questions` and rely on the right SideRail Tags card to act as the index, or (c) at minimum add `id="tags"` to a heading on the questions page so the anchor scrolls somewhere meaningful. Update `apps/web/data/topics.data.ts`. | n/a |
| F10 | `/cxc-ai/some-fake-chat-id` | missing-session handling | **polish** | Visiting a non-existent chat ID does not 404 — it silently renders the empty composer. `getAiChatSnapshot(chatId)` returns an empty `messages` array, the page mounts, and the rail does not show a "chat not found" indicator. The visit also creates a phantom session in the rail on the next layout render. | Either (a) call `notFound()` in `app/cxc-ai/[chatId]/page.tsx` when the snapshot has no persisted session, or (b) render an inline notice in the chat surface ("This conversation could not be found. Start a new chat.") and avoid bumping `updatedAt` until a real first message is sent. | `/tmp/dr-cxcai-fake-1440-full.png` |
| F11 | `/cxc-ai` | `ChatShell` h1 | **polish** | The `<h1>CXC AI</h1>` carries an inline `style={{ borderRadius: "var(--radius-title)" }}`. Text nodes don't have a visible border, so the radius does nothing. Same dead style is on `<h1>Questions</h1>` in `app/(forum)/questions/page.tsx`. Remove or move it onto an actual surface (a hero pill) if you want to use it. | Delete the inline `style` from both h1s. If a future hero treatment lands, apply the radius to that wrapper. | n/a |
| F12 | `/cxc-ai` | `ChatHistoryRail` length | **polish** | The rail enumerates every session ever (17+ visible during QA). At realistic usage it will scroll the page far past the conversation surface. The chat surface has `min-h-[40rem]` and the rail has no scroll containment, so an empty conversation looks lopsided next to a tall rail. | Wrap the `<ul>` in `max-h-[calc(100vh-…)] overflow-y-auto` and pin to `sticky top-[64px]`. Cap the list to last ~30 sessions client-side, with a "Show all" expander. File: `apps/web/features/cxc-ai/components/chat-history-rail.tsx`. | `/tmp/dr-cxcai-1440-full.png` |
| F13 | `/cxc-ai` | rail item titles | **polish** | Every session in the rail is titled "New CXC AI chat". Without seeded data and without the title-derivation logic firing, every row is indistinguishable except by timestamp. The visual hierarchy collapses. | This is partly a backend concern, but the rail can derive a cheap fallback from the first user message (already on `AiChatSession.preview` if exposed) instead of falling through to "Untitled chat" / "New CXC AI chat". | `/tmp/dr-cxcai-1440-full.png` |
| F14 | `/questions` | filter tab spacing | **polish** | The filter-tab row sits 16px below the title underline; the spec rhythm elsewhere is `space-6` (24px). Title underline → tabs feels tight. Also the row has `pb-4` then a divider, then `mt-6` to the feed — that's 16+1+24 = 41px, where 24+24 would feel cleaner. | In `app/(forum)/questions/page.tsx` change `mt-4` on the filter row to `mt-6` and consider dropping the second border (the title's border-b is enough). | `/tmp/dr-questions-1440-fold.png` |
| F15 | `/ask` | "Back to questions" link | **polish** | The Back link is colored cardinal red and uses an em-arrow ("← Back to questions") sitting directly above the serif h1. The arrow + red color reads as an action button, but it's a plain link. Also creates an extra visual line above the title that the canonical image doesn't show. | Either render it as a small ink-500 link (same neutral as the breadcrumb on Stack Overflow) or move it inside the title row as an icon-only back. File: `apps/web/features/ask/components/ask-form.tsx` (or wherever it lives). | `/tmp/dr-ask-1440-fold.png` |
| F16 | `/questions` | feed card border | **taste** | The empty-state card has a 1px ink-100 border and `bg-surface-base`. On the white page background the border barely reads; the card looks like a floating outline rather than a contained surface. | Option A: keep as-is (subtle is intentional). Option B: use `bg-surface-sunk` (#fafafa) to give it weight without a shadow. Recommendation: B — matches the chat surface treatment and reads as a placeholder slot. | `/tmp/dr-questions-1440-fold.png` |

---

## 3. Per-route notes

**`/` redirect.** Lands on `/questions` immediately, no flash. Good.

**`/questions`** (1440). Hierarchy is solid: serif "Questions" title, hairline divider, three filter tabs, empty-state card. Active "Newest" tab is cardinal-red bg / white text with rounded-md — clean and matches the canonical image. The empty-state copy is exactly what the brief requested. Issues: F4 (column top misalignment), F5 (CTA shape mismatch), F14 (filter tab top spacing), F16 (taste on card weight). Active TopicRail "Questions" item shows a 3px cardinal-red left bar at the correct position. Confirmed.

**`/questions?sort=active`** and **`?sort=unanswered`**. Tab active state swaps cleanly. No regression. Same empty-state issues as above.

**`/questions?tag=advising`**. Title sub-line shows "Filtered by tag advising. Clear" with the cardinal-red Clear link — that part is good and discoverable. The empty card below is wrong (F3): it claims "No questions yet" rather than "no matches for this tag". This is the most user-confusing issue in the build.

**`/ask`**. Form layout matches the canonical image: Title, Body, Tags, Post Question. Focus ring on Title is the spec'd 2px cardinal-red outline. Inputs are square 1px-bordered and the form breathes well. Issues: F7 (error state weakness), F15 (Back link weight). The "8 slots left" Tags helper text is a nice touch.

**`/cxc-ai`** (1440). The two-rail layout reads as intended: TopicRail (180px) → ChatHistoryRail (220px) → wide chat surface. Chat surface uses `bg-surface-sunk` which gives it the right "slot for content" feel without a shadow. Issues: F6 (duplicate New chat button), F8 (Send disabled state), F12 (rail length unbounded), F13 (every session is "New CXC AI chat"). Active rail item gets cardinal-red left bar matching TopicRail — visual consistency on this is good.

**`/cxc-ai/[chatId]`** (fake id). Does not crash, does not 404 — silently renders an empty conversation (F10). The active rail highlight matches whatever id was visited but the underlying session may not exist.

---

## 4. Cross-route consistency

- **Rail item height.** TopicRail items, ChatHistoryRail items, and the chat-history "New chat" button are all `h-11` with `rounded-md`. Consistent. Good.
- **Filter tabs vs Ask Question button.** Both are `h-9`, `rounded-md`, `text-sm`. Consistent. Good.
- **`<main>` padding.** `app/(forum)/questions/page.tsx` adds `py-8 px-6 sm:px-8`. `apps/web/features/cxc-ai/components/chat-shell.tsx` adds `py-6 px-6 sm:px-8`. The shell's `<main>` already adds `py-6`. So forum routes get py-14 vs cxc-ai's py-12. Pick one; suggest dropping the inner wrapper paddings and letting `<main>` own them. (Tied to F4.)
- **Title radius.** The vestigial `borderRadius: "var(--radius-title)"` inline style appears on both serif h1s. Drop it (F11).
- **Primary buttons.** Top-bar Ask Question is `rounded-md`. Empty-state Ask a Question is square. Send is square. Mixed system; rounded-md should win per the softened rule (F5, F8).
- **Card backgrounds.** Side-rail About/Tags cards: `bg-surface-base`. Question empty card: `bg-surface-base`. Chat surface: `bg-surface-sunk`. Two patterns coexist; maybe intentional (chat-as-content vs cards-as-meta). Worth a deliberate call.

---

## 5. Taste calls (decisions for the user)

- **F16 — empty-state card background.**
  - A: keep `bg-surface-base` (subtle, 1px border only). Pro: lightweight, page-as-canvas reading.
  - B: switch to `bg-surface-sunk` (matches chat surface). Pro: reads as a placeholder slot, gives the empty state more weight.
  - Recommendation: **B**.
- **Source pill rounding.** Current is square. Spec says "square or hairline-rounded — consistent". Tags in the question row are also square. Recommendation: **keep square** for everything that is "data label" (tags, source pills) and reserve `rounded-md` for "interactive control" (filter tabs, primary buttons, rail items, search, side-rail card outers). This is a clean rule.
- **Rail item width.** TopicRail = 180px, ChatHistoryRail = 220px. Recommendation: **keep different**. Chat session titles need more room; making the topic rail 220px would shift main left without reason.
- **"Back to questions" link weight.** Cardinal red + arrow is one option; a small ink-500 breadcrumb is the other. Recommendation: **ink-500 breadcrumb** — the arrow + red reads as a button.

---

## 6. Things that look right (do not touch)

- Cardinal red top bar with white wordmark and search input. Sticky, z-30 working correctly.
- Serif `Questions` h1 at 4xl/5xl with tight tracking. Matches canonical image.
- Active rail-item treatment: 3px cardinal-red left bar + bold ink-900 label + ink-50 background. Confirmed via computed style: `border-left-color: rgb(140, 21, 21)` and `border-left-width: 3px`.
- Filter tab system: rounded-md, cardinal-red active fill, neutral hover. Reads cleanly.
- Empty-state copy on `/questions` ("No questions yet. Be the first — Ask a Question.") matches the brief verbatim.
- Empty-state copy on `/cxc-ai` ("Ask anything about Stanford. CXC AI cites public Q&A when it can.") matches the brief.
- Ask form fields: square inputs, 1px ink-100 border, 2px cardinal-red focus ring. Clean.
- No gradients, no glassmorphism, no decorative emojis, no soft shadows, no bouncy animations. Discipline holds.
- Side-rail About/Tags cards: 1px border, square corners on the inside lists, hover changes link to cardinal red. Good restraint.
- 1264px container at >=xl: keeps content centered with whitespace flowing outside. Verified at 1600px.
- Mobile collapse of both rails is the correct call (no nav UI overlap), even though the missing top nav itself is F2.
- No console errors on any route tested.

---

## 7. Open questions

1. **Should `/questions?tag=…` be a real filtered URL or an index of tags?** Currently it's a filter, and the rail "Tags" item points to a non-existent anchor. If Tags is meant to be an index page, F9 needs a route, not a copy fix.
2. **Do we want a header "New chat" button on `/cxc-ai/*` at all?** F6 calls for dropping it. If the answer is "no", removal is one diff. If it should stay (e.g. for users who collapsed the rail mentally), it should at least match the rail button's shape.
3. **What is the intended responsive breakpoint for the rails?** Current `lg:block` (1024px) for TopicRail and `xl:block` (1280px) for SideRail leaves a 256px tablet band with no nav (F2). Spec says "both rails collapse" at mobile but doesn't define mobile.
4. **Should the chat-history rail show DB-empty messaging when truly empty, or is the seeded "17 New CXC AI chats" coming from auto-created sessions during dev?** The spec promised "DB stays empty" but the rail is full. F13 won't matter once that's resolved.
5. **Is the chat surface `min-h-[40rem]` (640px) intentional for the empty state, or only for active conversations?** On an empty `/cxc-ai` it leaves a large gray rectangle that the user can read as "loading" or "broken iframe". A shorter empty-state with a one-line CTA might land better.

---

## Screenshot index (for the fix-applier)

All screenshots in `/tmp/`:

- `dr-root-redirect.png` — `/` redirect target
- `dr-questions-1440-full.png`, `dr-questions-1440-fold.png` — `/questions` desktop
- `dr-questions-active-1440.png` — `?sort=active`
- `dr-questions-unanswered-1440.png` — `?sort=unanswered`
- `dr-questions-tag-advising-1440.png` — `?tag=advising` (F3 evidence)
- `dr-ask-1440-full.png`, `dr-ask-1440-fold.png` — `/ask`
- `dr-ask-empty-submit.png` — `/ask` empty submit (F7 evidence)
- `dr-ask-title-focus.png` — focus ring proof
- `dr-cxcai-1440-full.png`, `dr-cxcai-1440-fold.png` — `/cxc-ai`
- `dr-cxcai-fake-1440-full.png` — fake chat id (F10)
- `dr-questions-1600.png` — wide desktop, 1600px
- `dr-questions-1024.png` — lg edge (TopicRail visible, SideRail hidden)
- `dr-questions-900.png`, `dr-cxcai-900.png` — tablet (F2 evidence)
- `dr-questions-390.png`, `dr-cxcai-390.png` — mobile (F1 evidence)
- `dr-topic-rail.png`, `dr-chat-rail.png`, `dr-chat-rail-active.png` — rail close-ups
- `dr-rail-focus.png` — rail focus ring
- `dr-send-focus.png`, `dr-send-focus-fold.png` — composer focus state
