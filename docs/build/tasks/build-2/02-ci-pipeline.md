# Task — CI Pipeline (GitHub Actions)

You own the project's first CI pipeline. Single self-contained task.

## Goal

Add `.github/workflows/ci.yml` that runs `pnpm install` + `typecheck` + `lint` + `test` + `build` on every push to `main` and every pull request. CI must catch the same things the local `pnpm` scripts catch — no laxer.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading

- `package.json` (root) — confirm script names: `dev`, `build`, `lint`, `typecheck`, `test`.
- `pnpm-workspace.yaml` — confirms apps/_ + packages/_.
- `turbo.json` — task graph (so the workflow can rely on Turbo for caching).
- `STRUCTURE.md` — folder layout.
- `.npmrc` if it exists — pnpm settings.
- The existing `.github/` directory — list what's already there.

## What to ship

`.github/workflows/ci.yml`:

- Triggers: `push` on `main`, `pull_request` on any branch targeting `main`.
- Concurrency group keyed on `github.workflow` + `github.ref` so superseded runs cancel.
- Single job `verify` running on `ubuntu-latest`.
- Steps:
  1. `actions/checkout@v4` with full history (depth 0) — Turbo's remote cache benefits from history.
  2. Set up pnpm via `pnpm/action-setup@v4`. Pin to the version in the root `package.json` `packageManager` field (currently `pnpm@10.33.2`).
  3. Set up Node via `actions/setup-node@v4` with the version from `.nvmrc` if it exists, else node 22.
  4. `pnpm install --frozen-lockfile`
  5. `pnpm typecheck`
  6. `pnpm lint`
  7. `pnpm test`
  8. `pnpm build`

If `.nvmrc` doesn't exist, also add it with `22.13.1` (matches local) so the local node version is the canonical truth.

## Hard rules

- **Do not** add Postgres or any service container to CI. Tests are unit-level, no DB.
- **Do not** introduce `OPENAI_API_KEY` or any other secret references — none of the build steps need them.
- **Do not** add deploy steps. CI is verify-only; deploy can be a separate workflow later.
- **Do not** modify `package.json` scripts.
- **Do not** introduce new dependencies.

## Verification

You can't run GitHub Actions locally easily. Instead:

1. Run `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build` in your shell — exactly what CI will run. Confirm all green.
2. `cat .github/workflows/ci.yml` and visually verify the YAML is well-formed.
3. Optionally use `act` (https://github.com/nektos/act) if installed, but don't add it as a dep.

## Output

Commit your work with a clean message on `main` (you can commit directly — no branch needed). Then write a short note to `docs/build/proposals/ci-pipeline.md` listing what you shipped and the verification status.

## Report back

≤150 words. File created, verification status, blockers.
