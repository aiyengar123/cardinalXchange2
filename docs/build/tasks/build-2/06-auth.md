# Task — Authentication (Stanford SUNet)

This is the **last** roadmap item per `CLAUDE.md` and `docs/architecture.md`. The user is opting in now. Auth becomes IN SCOPE.

## Goal

Add real authentication so `getViewer()` returns a verified Stanford user instead of the dev stub. Stanford SUNet identity (SAML or OIDC), with a `stanford.edu` magic-link fallback for early development. Profile + settings pages cascade after auth lands.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading (in this order)

1. `CLAUDE.md` — note the "Out Of Scope" section flagging auth as the LAST milestone. Update this section to mark auth as in-scope now.
2. `docs/architecture.md` — read the "Profile And Settings" + "Local Dev" sections; this task moves them out of "later milestones" and into "current scope". Update the doc.
3. `STRUCTURE.md` — the folder map. Auth code lives in `apps/web/backend/auth/` (new). Login/signout/profile pages live in `apps/web/app/(auth)/` (new route group, no shell wrap) or under the existing groups depending on UX intent.
4. `apps/web/backend/viewer/viewer.ts` (or `index.ts`) — the current `getViewer()` stub reading `DEV_VIEWER_*` env vars. This becomes the seam where real auth plugs in.
5. `packages/db/prisma/schema.prisma` — current models. You'll add `User`, `Account`, `Session`, `VerificationToken` (or whatever the chosen library expects) and back-fill `Question.authorId` / `Answer.authorId` once the user model exists.
6. `apps/web/backend/http/contracts.ts` — the wire DTOs. `authorDisplay` is currently a string; after auth, it becomes derived from a `User` record.

## Library: Better Auth

**Use Better Auth.** `docs/architecture.md` already names Better Auth as the planned library under deferred milestones — that decision pre-dates this brief and is not up for re-evaluation.

- Docs: https://www.better-auth.com/
- Prisma adapter: https://www.better-auth.com/docs/adapters/prisma
- Schema generator: `pnpm exec @better-auth/cli generate` (or the equivalent npx flow)
- SSO plugin for Stanford SAML/OIDC: https://www.better-auth.com/docs/plugins/sso
- Magic link plugin for `stanford.edu` fallback: https://www.better-auth.com/docs/plugins/magic-link
- Tables created (lowercase, not PascalCase): `user`, `session`, `account`, `verification`

Do NOT use Auth.js / NextAuth, Lucia, Clerk, Stytch, WorkOS, or any other auth library.

## What to ship

1. **Schema changes** in `packages/db/prisma/schema.prisma`:
   - Better Auth's standard tables: `user`, `session`, `account`, `verification` (lowercase model names per Better Auth convention). Use `pnpm exec @better-auth/cli generate` to produce the canonical schema additions, then merge into `schema.prisma`.
   - Back-fill `Question.authorId` and `Answer.authorId` as nullable for now (no users exist yet, so existing rows can't have an author). Keep `authorDisplay` for back-compat. New rows get `authorId` set, referencing `user.id`.
   - Migration: `pnpm --filter @cardinalxchange/db prisma:dev --name add_better_auth`.
2. **Better Auth setup**:
   - `pnpm add better-auth` in `apps/web`. Add `@better-auth/cli` as a dev dep.
   - `apps/web/backend/auth/auth.ts` — `betterAuth({ database: prismaAdapter(db, { provider: "postgresql" }), emailAndPassword: { enabled: false }, plugins: [magicLink({ allowedDomain: "stanford.edu" }), sso({ provider: "saml", ...stanfordConfig })] })`.
   - `apps/web/app/api/auth/[...all]/route.ts` — re-exports `auth.handler` for GET and POST.
   - `apps/web/middleware.ts` — uses Better Auth's session middleware so requests carry the session cookie.
3. **Replace the viewer stub**:
   - `apps/web/backend/viewer/viewer.ts` `getViewer()` now calls `auth.api.getSession({ headers })` and returns the real session's user (or a sentinel "anonymous" viewer if no session).
   - Route handlers that write (POST `/api/questions`, POST `/api/questions/[id]/answers`, POST `/api/cxc-ai`) require a session — return 401 if `getViewer()` is anonymous.
   - GET routes stay public.
4. **UI**:
   - `apps/web/app/(auth)/login/page.tsx` — login screen with "Sign in with Stanford" button + email-magic-link form (stanford.edu only).
   - `apps/web/app/(auth)/login/loading.tsx` and `error.tsx`.
   - Top bar gains a user menu (avatar + name + Sign out) on the right side, **replacing** the "Ask Question" button when signed out, OR sitting beside it when signed in. Sign out triggers `signOut()` and redirects to `/`.
   - When the user clicks Ask Question while signed out, route them to `/login?next=/ask`.
5. **Profile + settings (basic)**:
   - `apps/web/app/(forum)/users/[userId]/page.tsx` — public profile: name, image, "asked X questions, answered Y times". Lists their public questions and answers.
   - `apps/web/app/(forum)/settings/page.tsx` — display name + email + "delete my account" (soft-delete is fine for now).
6. **Env vars** (document in `.env.example`):
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`.
   - `AUTH_URL` — `http://localhost:3000` for dev.
   - `STANFORD_SAML_*` or OIDC equivalents — placeholders the team can fill in for prod.
   - `EMAIL_SERVER_*` for magic-link fallback (Mailtrap or similar in dev).

## Hard rules

- **Update `CLAUDE.md`** to remove auth from the "Out Of Scope" list. Add a new "Auth" section pointing at `apps/web/backend/auth/` and noting the `getViewer()` seam.
- **Update `docs/architecture.md`** to move auth out of "later milestones" and document the chosen library.
- **Update `STRUCTURE.md`** to add the new folders and files.
- **No real Stanford SAML credentials** in committed config — placeholders only. The team configures real values in production.
- **Keep `getViewer()` as the only seam** that returns the current user. Backend services do not call `auth()` directly.
- **Do not seed users**. Empty DB is canonical. The first real user is created on first login.
- **Tests**: add Vitest cases for the new Zod parsers, the new `getViewer()` (mocked), and a minimal smoke test for the login page rendering.

## Verification

- `pnpm install` — installs new deps cleanly.
- `pnpm --filter @cardinalxchange/db prisma:dev --name add_auth_tables` — migration applies cleanly.
- `pnpm --filter @cardinalxchange/db prisma:generate` — Prisma client picks up new tables.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` — all green.
- Visit `http://localhost:3000/login` via `/browse` (gstack) — page renders.
- Smoke-test sign-in: trigger the email magic-link flow with a `*@stanford.edu` test address (or a Mailtrap inbox). Confirm a session cookie exists after.
- POST `/api/questions` without a session → 401.
- POST `/api/questions` with a session → succeeds, `authorId` populated.

## Output

This is BIG. Use sub-agents if anything below is parallelizable (schema migration vs UI vs middleware can all run in parallel after the schema is decided). Commit in **logical chunks** rather than one mega-commit:

- `feat(db): add auth tables`
- `feat(auth): wire next-auth with Stanford SAML + email magic link`
- `feat(viewer): replace stub with real session`
- `feat(auth-ui): login + user menu + signout`
- `feat(profile): /users/[id] + /settings`
- `chore: update CLAUDE.md / architecture.md / STRUCTURE.md / .env.example`
- `test: auth smoke tests`

When all green and committed, write `docs/build/proposals/auth.md` summarizing what shipped, the chosen library + version, env vars added, open questions (especially around the SAML metadata exchange with Stanford IT).

## Report back

≤300 words. Library chosen, commit count, verification status, blockers.
