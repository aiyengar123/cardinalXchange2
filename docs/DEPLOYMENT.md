# Deployment

Get CardinalXchange on the public internet, **free tier first**. Custom domain and Stanford SSO come later — start with what you can ship in an afternoon.

`SETUP.md` covers local development. This file covers shipping.

---

## Step 1 — Database (Supabase free tier, ~10 min)

[supabase.com](https://supabase.com) → sign in with GitHub → **New project**.

- **Name:** `cardinalxchange`
- **Database password:** click _Generate_ and save it in 1Password.
- **Region:** `East US (North Virginia)` (closest to Vercel default)
- **Plan:** Free

Wait ~2 min for provisioning.

**Settings → Database → Connection string** — copy two URLs (toggle the dropdown):

- **Connection pooling** (Transaction mode, port 6543) → save as `DATABASE_URL`
- **Direct connection** (port 5432) → save as `DIRECT_URL`

**Save both in 1Password.** You'll paste them into Vercel in Step 3.

---

## Step 2 — Email (Resend free tier, ~5 min)

Magic-link login needs an email transport. Resend has the simplest free tier — 3,000 emails/month, no DNS verification needed for `onboarding@resend.dev` sender.

[resend.com](https://resend.com) → sign up → **API Keys → Create API Key** → name it `cardinalxchange-prod`.

**Save in 1Password:**

```
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=<your API key>
EMAIL_FROM=onboarding@resend.dev
```

(When you get a custom domain in Step 4, change `EMAIL_FROM` to `no-reply@<your-domain>` and verify the domain in Resend → Domains.)

---

## Step 3 — Vercel deploy (~15 min)

[vercel.com](https://vercel.com) → sign in with GitHub → **Add New → Project** → import `adarshambati1/cardinalXchange`.

Vercel auto-detects Next.js. Override only:

- **Build Command:** `pnpm build`
- **Install Command:** `pnpm install --frozen-lockfile`

**Environment Variables** — paste these:

```
NEXT_PUBLIC_APP_URL=https://<project-name>.vercel.app
DATABASE_URL=<Supabase pooled URL>
DIRECT_URL=<Supabase direct URL>

BETTER_AUTH_SECRET=<run: openssl rand -base64 32>
BETTER_AUTH_URL=https://<project-name>.vercel.app

EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=<your Resend API key>
EMAIL_FROM=onboarding@resend.dev

OPENAI_API_KEY=sk-...                          # optional; CXC AI degrades gracefully without it
OPENAI_MODEL=gpt-5-mini
```

(`<project-name>` is whatever Vercel auto-generates — usually `cardinalxchange-<hash>.vercel.app`. You'll see it after the first deploy. Update `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` to match.)

**Click Deploy.** First build takes 3-5 min.

After it deploys, **run the migration once** from your local terminal:

```bash
cd "/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange"

DATABASE_URL="<Supabase pooled URL>" \
DIRECT_URL="<Supabase direct URL>" \
pnpm --filter @cardinalxchange/db prisma:deploy
```

Output should list every applied migration, ending with `add_better_auth`.

**Smoke test** in a fresh incognito window at `https://<project-name>.vercel.app`:

1. `/questions` shows the empty state.
2. `/login` shows the magic-link form.
3. Submit your `*@stanford.edu` address.
4. Magic-link email arrives from `onboarding@resend.dev` within 60s.
5. Click it → you're signed in, can post a question, see it on `/questions`.

**Done.** The app is live. Anyone with a `*@stanford.edu` email can use it.

---

## Step 4 — Custom domain (later, when you want one)

Skip until you actually want a real URL. The `.vercel.app` subdomain works fine for testing and sharing with friends.

When you're ready:

1. Buy a domain at [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (~$11/yr for `.app`).
2. Vercel project → **Settings → Domains** → add your domain → follow the DNS instructions in Cloudflare DNS.
3. Update Vercel env vars: `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` → `https://<your-domain>`.
4. Resend → **Domains** → add your domain → paste the DKIM/SPF records into Cloudflare DNS → wait ~30s for verification.
5. Update `EMAIL_FROM=no-reply@<your-domain>` in Vercel.
6. Redeploy.

---

## Step 5 — Stanford SSO (later, blocks on Stanford IT)

Magic-link login works for any Stanford email today. Real SSO (single-sign-on tied to active Stanford affiliation) requires Stanford IT registration — they take days to weeks to respond.

When you want this, email **uit-help@stanford.edu**:

> Subject: SAML SP registration request — CardinalXchange (Stanford-affiliated student project)
>
> Hi UIT, CardinalXchange is a student-built Stanford-only Q&A platform. We'd like to register as a SAML Service Provider so users can sign in with their SUNet ID.
>
> We will provide:
>
> - Entity ID: `https://<your-domain>/api/auth/saml`
> - ACS URL: `https://<your-domain>/api/auth/callback/saml`
> - Audience: `https://<your-domain>`
> - SP signing certificate (we can generate one — please advise)
>
> Could you tell us:
>
> 1. Stanford IdP metadata URL.
> 2. Required attribute mappings (we need at minimum: mail, givenName, sn, eduPersonPrincipalName).
> 3. Whether registration needs a security review or sponsor approval.

When they reply, paste 3 env vars in Vercel (`STANFORD_SAML_ENTITY_ID`, `STANFORD_SAML_SSO_URL`, `STANFORD_SAML_CERT`), redeploy, and the SSO button on `/login` activates.

---

## Step 6 — GitHub branch protection (do once you have collaborators)

GitHub → repo **Settings → Branches → Add ruleset for `main`**:

- ✅ Require a pull request before merging
- ✅ Require status checks: select **`verify`** from CI
- ✅ Require branches to be up to date before merging

Save. Now CI must be green to merge into `main`.

---

## Operational playbook

### Push a change

```bash
git checkout -b feat/something
# edit, commit, push
gh pr create --fill
# CI runs, get review (or self-merge if solo), merge.
# Vercel auto-deploys main on merge.
```

### Roll back a bad deploy

Vercel → Deployments → pick the last good one → **Promote to Production**. ~5 seconds, no rebuild.

### Database schema change

```bash
# Local: edit packages/db/prisma/schema.prisma, then:
pnpm --filter @cardinalxchange/db prisma:dev --name <descriptive>

# This commits a new migration to the repo. CI verifies it generates cleanly.

# After merge, apply to prod:
DATABASE_URL="<prod pooled>" DIRECT_URL="<prod direct>" \
  pnpm --filter @cardinalxchange/db prisma:deploy
```

Migrations are applied **manually**, not from Vercel build, so a failed migration never blocks a deploy.

### Add a new env var

1. Add to `.env.example` with a comment.
2. Add to Vercel project env (Production + Preview + Development).
3. Reference via `process.env.<VAR>`.

### Where to look when something breaks

- **App errors:** Vercel project → Deployments → latest → **Runtime Logs**.
- **DB errors:** Supabase project → **Logs**.
- **Email errors:** Resend dashboard → **Emails** (delivery + bounce status per message).

---

## Environment variables reference

| Var                     | Required?         | Where it comes from                                  |
| ----------------------- | ----------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`   | Yes               | Your Vercel URL or custom domain                     |
| `DATABASE_URL`          | Yes               | Supabase pooled (port 6543)                          |
| `DIRECT_URL`            | Yes               | Supabase direct (port 5432)                          |
| `BETTER_AUTH_SECRET`    | Yes               | `openssl rand -base64 32`                            |
| `BETTER_AUTH_URL`       | Yes               | Same as `NEXT_PUBLIC_APP_URL`                        |
| `EMAIL_SERVER_HOST`     | Yes               | `smtp.resend.com` (or your provider)                 |
| `EMAIL_SERVER_PORT`     | Yes               | `587`                                                |
| `EMAIL_SERVER_USER`     | Yes               | `resend` (or your provider's username)               |
| `EMAIL_SERVER_PASSWORD` | Yes               | Resend API key                                       |
| `EMAIL_FROM`            | Yes               | `onboarding@resend.dev` initially; your domain later |
| `OPENAI_API_KEY`        | Optional          | OpenAI dashboard (CXC AI falls back without it)      |
| `OPENAI_MODEL`          | Optional          | Defaults to `gpt-5-mini`                             |
| `STANFORD_SAML_*`       | When SSO ready    | Stanford IT                                          |
| `AUTH_DEV_BYPASS`       | **Never in prod** | Dev only                                             |
| `DEV_VIEWER_*`          | **Never in prod** | Dev only                                             |

---

That's it. Steps 1-3 get you a working app. Steps 4-6 polish it.
