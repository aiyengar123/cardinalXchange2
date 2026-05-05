# Future

A running list of things to consider, not commit to. Edit freely. When something graduates from "consider" to "do," cut it from here and put it in a real plan or issue.

Format per item: **what it is** · _when it likely matters_ · brief note.

---

## Growth & Marketing

- **Marketing site / landing page** · _before public launch_ · The current `/questions` redirect is fine for invited beta users. A real `/` landing (problem, screenshots, who it's for, "request access") becomes important once you stop personally onboarding everyone.
- **Branding pass** · _before public launch_ · Logo (the cardinal-red `S` is a stopgap), favicon, OG image, social-card image generator, brand guidelines doc. The current shell looks generic-Stanford; it could feel more distinctive.
- **OG image generator** · _before sharing on social_ · `app/og/route.ts` using `next/og` to render question titles + tags into a card. Makes shared links look like a product, not a 404.
- **Onboarding email** · _after first 10 sign-ups_ · Postmark/Resend transactional email greeting new users + a starter list of questions to answer. Sets the norm that you answer too, not just ask.
- **Stanford-channel distribution** · _post-MVP_ · Where do Stanford students actually find tools? Class GroupMes, Ed Discussion (ironically), residence-hall Slacks, club newsletters, the Daily. Pick 2-3 to seed.
- **Referral / invite mechanic** · _if growth stalls_ · "Invite a Stanford friend" with attribution. Doesn't need to be aggressive — Stanford is small enough that organic word-of-mouth might suffice.
- **Power-user spotlight** · _post-100 active users_ · Highlight people who answered the most questions in a quarter. Public profile already exists; just add a `/leaderboard` or weekly digest email.
- **Class GroupMe scraper / cross-poster (one-way)** · _if data is hard to seed_ · Mirror approved questions from class GroupMes into CardinalXchange with consent. Risky, talk to the team first.
- **Seed content from prior quarters** · _only if scope changes_ · Currently `CLAUDE.md` says no seed data. If marketing demands it, the right path is "import from public Ed Discussion threads with explicit owner consent" — not synthetic.

---

## Product

- **Notifications** · _after first real users post questions and want answers_ · In-app + email when someone answers your question. Schema is simple: `Notification { id, userId, kind, payload, readAt? }`.
- **Votes** · _after first thread of bad answers above good ones_ · Up/down votes on questions and answers. Pairs with reputation.
- **Reputation** · _after votes ship_ · Aggregate score from received votes + accepted answers. Surface on `/users/[id]`.
- **Accepted-answer marking** · _after multiple answers per question is common_ · Author marks one answer as "the" answer; bumps it to top of the list and gives the answerer rep.
- **Question editing** · _after first user typo'd post_ · Edit a question after creation. Add an edit-history table so future readers see the trail.
- **Answer editing** · _same trigger_ · Same as above for answers.
- **Image upload** · _first time someone wants to attach a screenshot_ · Cloudflare R2 or AWS S3 + a small upload route. Replace the existing markdown image syntax with real signed-URL flow.
- **Code syntax highlighting** · _post-launch polish_ · `shiki` (zero runtime cost, build-time highlight) into the markdown renderer. Most painful to read CS questions without it.
- **Math rendering (KaTeX)** · _if STEM Q&A becomes common_ · Add `katex` to `Markdown` for `$inline$` and `$$display$$` math. Adds ~75KB to bundle.
- **Real-time answer updates** · _if conversation feels async_ · Supabase Realtime subscriptions on `Answer` inserts → live append to the answer list without refresh.
- **Threaded comments on answers** · _only if needed_ · Stack Overflow has them; Ed Discussion has them. Adds complexity; defer until a real conversation can't fit in answer + counter-answer.
- **Search ranking improvements** · _when search results feel bad_ · Postgres `tsvector` + `ts_rank_cd`, or move to Meilisearch when scale demands. Currently relies on Prisma's basic LIKE.
- **CXC AI conversation memory across chats** · _if users want it_ · Currently each chat is isolated. Adding cross-chat memory would mean retrieving from prior `AiChatSession`s — moderate work, watch privacy implications.
- **Tag synonyms / aliases** · _after `cs229` and `CS-229` and `cs 229` create three different tags_ · A small admin tool to merge tag canonicals.
- **Dark mode** · _whenever_ · Tokens are color-named (not semantic) so a parallel palette is additive. Don't half-ship a toggle.
- **Mobile-native experience** · _very late, only if Stanford users heavily mobile_ · The current responsive layout is fine; native apps are 6+ months of effort for marginal lift.

---

## Auth & Identity

- **Stanford SAML SSO** · _blocks on Stanford IT_ · See `DEPLOYMENT.md` Step 5. Drafts an email to UIT, registers as SP, paste 3 env vars in Vercel. Until then, magic-link login covers anyone with `*@stanford.edu`.
- **Active-affiliation gating** · _if alumni signups become a problem_ · SAML attribute `eduPersonAffiliation` includes `student`, `faculty`, `staff`, `alum`. Filter at sign-up time if needed.
- **Profile completeness gate** · _if anonymous-feeling answers harm trust_ · Force users to set a display name + optional photo before posting their first answer.
- **Sponsored-guest flow** · _post-launch, only if researchers want collaborators_ · Stanford IdP supports guest accounts; would need an admin UI to invite + an email-domain bypass for `~@stanford.edu`.

---

## Operations / Infrastructure

- **Sentry** · _first 100 active users_ · Error tracking + release health. ~10 lines to install. Pays for itself the first time something breaks at 2am.
- **PostHog or Vercel Analytics** · _after launch, when you start making product decisions_ · Funnel: home → ask → submit. Identify where users drop. Free tiers cover early traffic.
- **Status page** · _if you have stakeholders who care about uptime_ · `instatus.com` or `statuspage.io`. Skip if it's just you and the team.
- **Rate limiting on `/api/cxc-ai`** · _before public launch_ · One bad actor can drain the OpenAI bill. Use Vercel's built-in rate limiter or `@upstash/ratelimit`. Per-IP or per-session, ~50 requests/hour seems sane.
- **Rate limiting on `/api/auth/sign-in/magic-link`** · _before public launch_ · Same threat model — someone scripting a bot to spam magic-link emails would burn your Resend quota.
- **Branch protection on `main`** · _as soon as you have collaborators_ · See `DEPLOYMENT.md` Step 6. Solo dev can skip; first time someone pushes broken code to main, you'll wish you had it.
- **Dependabot** · _whenever_ · `.github/dependabot.yml` for automated dep PRs. Saves hours over a year.
- **Lighthouse / web-vitals** · _post-launch, when there's traffic to measure_ · Bake into CI as a check, fail PRs that regress LCP > 2s. Premature before there's traffic.
- **A11y audit** · _post-launch_ · Keyboard nav, screen reader, contrast on cardinal-on-white edges. Already mostly clean (focus rings on every interactive); a real audit catches the rest.
- **Custom domain** · _when you want to stop saying "yeah, just go to cardinalxchange-prod.vercel.app"_ · See `DEPLOYMENT.md` Step 4.
- **Database backups beyond Supabase free tier** · _if you can't tolerate 7 days of loss_ · Supabase Pro extends to 30 days + point-in-time recovery. Free tier is 7 days daily backups only.
- **Switch from Vercel free to Pro** · _first time you hit an function-execution-time limit_ · ~$20/mo, gives 60s function timeouts (vs 10s) and more generous bandwidth.

---

## Email transport (Resend specifically)

- **Switch from `nodemailer` SMTP to Resend SDK** · _only if you adopt Resend-specific features_ · Currently we're vendor-agnostic via SMTP. Switch when you want webhooks (bounce/delivery), Audiences, scheduled sends, or batch idempotency.
- **Resend webhooks for bounces** · _post-launch_ · Listen for `email.bounced` and mark the user's email as invalid so we stop trying to send to dead addresses. Saves your Resend quota and improves deliverability score.
- **Domain DNS verification on Resend** · _step 1 of using a custom From address_ · Required before changing `EMAIL_FROM` away from `onboarding@resend.dev`. DKIM + SPF records into Cloudflare. ~30 sec to verify.
- **Reply-to address** · _if users start replying to magic-link emails_ · They will. Set `replyTo` to a real inbox you actually check, or `no-reply@cardinalxchange.app` with an auto-responder pointing them to `/help`.

---

## Code-quality / dev experience

- **Real e2e tests (Playwright)** · _if a refactor breaks the auth flow once_ · Vitest covers unit + component. A Playwright test for "magic-link login → post a question → see it on /questions" is the next layer.
- **Storybook for primitives** · _if `packages/ui` grows beyond Button_ · Currently 1 primitive (Button) means Storybook is overkill. Revisit if it's 5+.
- **Visual regression testing** · _post-launch_ · Percy or Chromatic. Catches CSS regressions you'd otherwise eyeball-miss.
- **API typed client** · _if frontend `fetch` calls drift from backend DTOs_ · Generate a typed client from the route handlers with `next-rest` or hand-roll wrappers in `frontend/api/`. Currently we trust DTO imports; this hardens it.
- **Open API / Swagger** · _only if you expose the API to anyone outside the app_ · Probably never for this product.
- **Bundle size budget** · _post-launch_ · Add `@next/bundle-analyzer` to CI; fail PRs that regress > 10%.

---

## Long-shot ideas (cut from here when they become real plans)

- **CXC AI tool: "find a study partner"** — match users by tag overlap and recent activity. Privacy-preserving by default.
- **Anonymous question mode** — sometimes people want to ask "is my advisor a jerk" without their name attached. Hard policy call; defer.
- **Question-of-the-week digest** — weekly email with the top thread. Manual at first, automated when there's pattern.
- **Public read-only mirror** — let non-Stanford users browse public Q&A but not post. Could help SEO, also could attract spam — defer until there's a reason.

---

How to use this file: when something here becomes real work, cut it from here and either open a GitHub issue or add it to a build plan in `docs/build/`. Don't let things rot here for months — either do them, kill them, or move them.
