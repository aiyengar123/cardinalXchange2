# Setup

End-to-end setup instructions for getting CardinalXchange running locally and shipped to production.

## Local Development

### Prerequisites

- macOS, Linux, or WSL2
- [Docker](https://docs.docker.com/get-docker/) for the local Postgres
- Node.js 22 (`.nvmrc` pins this; `nvm use` will pick it up)
- pnpm 10.33.2 (the `packageManager` field in `package.json` pins it; Corepack will install it on first run)

### One-time setup

```bash
git clone https://github.com/adarshambati1/cardinalXchange.git
cd cardinalXchange

# Install Node 22 if you don't have it
nvm use

# Bring up local Postgres
docker compose up -d postgres

# Install workspace deps + provision husky pre-commit hook
pnpm install

# Apply the migrations (creates Better Auth tables + product tables)
pnpm --filter @cardinalxchange/db prisma:dev
```

### Configure `.env`

`.env.example` has the full list. Copy it once and fill the auth vars:

```bash
cp .env.example .env

# Generate a secret
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env
echo "BETTER_AUTH_URL=http://localhost:3000" >> .env

# Keep the DEV_VIEWER_* shortcut working alongside real auth in dev
echo "AUTH_DEV_BYPASS=1" >> .env

# Optional: enable real CXC AI streaming. Without this the chat falls
# back to extractive answers from public Q&A retrieval.
echo "OPENAI_API_KEY=sk-..." >> .env
```

Email transport in dev: leave `EMAIL_SERVER_*` empty. Magic-link URLs are printed to the server console — copy and paste into the browser.

### Run

```bash
pnpm dev
```

Visit `http://localhost:3000`. Routes that work:

- `/` redirects to `/questions`
- `/questions` (and `/questions/[id]`)
- `/ask`
- `/tags`
- `/cxc-ai` (and `/cxc-ai/[chatId]`)
- `/login`, `/users/[id]`, `/settings` (auth-aware)

### Common commands

```bash
pnpm typecheck                                            # all workspaces
pnpm lint                                                 # all workspaces
pnpm test                                                 # Vitest, ~114 tests
pnpm test:watch                                           # interactive
pnpm build                                                # production build
pnpm format                                               # Prettier across the repo

pnpm --filter @cardinalxchange/db prisma:dev              # create + apply a migration
pnpm --filter @cardinalxchange/db prisma:generate         # regenerate Prisma client
pnpm --filter @cardinalxchange/db prisma:studio           # browse the DB
```

`pnpm install` provisions a husky pre-commit hook that runs `lint-staged` (Prettier + ESLint --fix) on staged files. Commits abort if ESLint can't fix something.

## GitHub Setup

CI is wired at `.github/workflows/ci.yml` and runs `typecheck` + `lint` + `test` + `build` on every push to `main` and every pull request.

### Branch protection (required)

GitHub → repo Settings → Branches → "Add rule for `main`":

- Require pull request reviews before merging
- Require status checks to pass — select the `verify` job
- Require branches to be up to date

### Optional polish

- **Settings → Actions → General → Workflow permissions:** Read and write (so future workflows can comment on PRs)
- **Dependabot:** add `.github/dependabot.yml` to get automated dependency PRs

## Production

Three external coordination items, then a Vercel deploy.

### A. Stanford SAML SSO (for real Stanford-only login)

Until Stanford IT shares SAML metadata, the SSO button on `/login` is disabled with a "coming soon" tooltip. Users sign in via the magic-link fallback.

1. Email Stanford IT (uit-help@stanford.edu) requesting SAML Service Provider registration for the production domain.
2. They will send you metadata: `entity_id`, `sso_url`, x509 `cert`.
3. Paste into production env as `STANFORD_SAML_ENTITY_ID`, `STANFORD_SAML_SSO_URL`, `STANFORD_SAML_CERT`.
4. Re-deploy. The SSO button activates.

### B. Managed Postgres

Recommended: Supabase. Neon and Railway also work.

1. Create a project. Copy both connection strings:
   - **Pooled** (used at runtime) → `DATABASE_URL`
   - **Direct** (used for migrations) → `DIRECT_URL`
2. Run migrations against it once:
   ```bash
   DATABASE_URL="..." DIRECT_URL="..." pnpm --filter @cardinalxchange/db prisma:deploy
   ```
3. Add both URLs to Vercel project env.

### C. Email transport (for production magic links)

Pick one: Postmark, AWS SES, Resend, Mailgun. Avoid SendGrid free tier — Stanford domains often hit deliverability issues there.

Add to production env:

```
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=no-reply@yourdomain.com
```

Magic-link emails will route through this transport in production. In dev, leave empty and read the console.

### D. Vercel deploy

Vercel project settings:

```
Framework Preset:  Next.js
Root Directory:    (repo root)
Build Command:     pnpm build
Install Command:   pnpm install --frozen-lockfile
```

Add **every** env var from `.env.example` to Vercel project env. Connect the GitHub repo. Pushes to `main` auto-deploy.

After first deploy, run a quick smoke test:

- Visit `/questions` — empty state should render
- Visit `/login` — magic-link form should render (SSO button disabled)
- POST a magic-link request to your test email — confirm the email arrives
- Click the link — confirm session sticks

## Operational notes

- **Empty DB is canonical.** No seed data exists. Every page is built to render correctly with zero rows.
- **`AUTH_DEV_BYPASS=1`** keeps the `DEV_VIEWER_*` env shortcut working in dev so the app is usable without going through the magic-link flow every cookie expiry. Never set this in production.
- **`pnpm test` runs Vitest** across 4 workspaces. It is not aliased to `tsc --noEmit` anymore.
- **Pre-commit hook is real.** Don't bypass with `--no-verify` — fix the lint instead.
- **CI must be green** before merge. The `verify` job runs the same commands you can run locally.

## Documentation

- `STRUCTURE.md` — full repo map, naming conventions, boundary rules
- `docs/architecture.md` — canonical product/architecture spec
- `CLAUDE.md` — AI agent / repo-convention instructions
- `docs/build/` — historical build plan markdowns + per-task agent briefs
- `docs/build/proposals/` — wave proposals, critiques, and implementation notes

If anything in this file goes stale, fix it here. README points readers at this file for the canonical setup steps.
