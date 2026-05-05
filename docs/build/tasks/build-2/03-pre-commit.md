# Task — Pre-commit Hook (lint-staged + husky)

Block bad commits at the source. Self-contained.

## Goal

Install + configure husky + lint-staged so that `git commit` automatically runs `eslint --fix` + `prettier --write` on staged files only, and aborts if eslint can't fix something.

## Working directory

`/Users/adarshambati/Desktop/Senior Year Classes/CS278/cardinalXchange`

## Required reading

- `package.json` (root) — see `scripts`, `devDependencies`, `packageManager`, `lint-staged` section if any.
- `eslint.config.mjs` — current ESLint flat config.
- `.prettierrc.json` — current Prettier config.
- `.gitignore` — confirm `.husky/_` (husky's internal cache) is not tracked.

## What to ship

1. `pnpm add -D -w husky lint-staged` (root workspace).
2. Run `pnpm exec husky init` (creates `.husky/pre-commit` with a starter hook).
3. Replace the body of `.husky/pre-commit` with `pnpm exec lint-staged` (and only that — drop husky's example).
4. Add a `lint-staged` config to the root `package.json` (or a separate `.lintstagedrc.json` if you prefer) with:
   ```jsonc
   {
     "*.{ts,tsx,js,mjs,cjs}": ["prettier --write", "eslint --fix"],
     "*.{md,json,css,yml,yaml}": ["prettier --write"],
   }
   ```
   Order matters — prettier first (formatting), then eslint (which checks logic).
5. Add a root `prepare` script: `"prepare": "husky"` so `pnpm install` provisions hooks for new clones.
6. Document the convention in `CLAUDE.md` "Testing" or a new "Development" section: "git commits run lint-staged via husky pre-commit".

## Hard rules

- **Do not** install eslint or prettier (already deps); only husky + lint-staged are new.
- **Do not** make the hook also run typecheck or vitest (too slow for every commit).
- **Do not** disable the hook with `--no-verify` flags or env vars in any committed file.
- The hook runs on **staged files only**, never the whole repo.
- Make sure the hook is **executable** (chmod +x .husky/pre-commit).

## Verification

1. Make a trivial throwaway change (e.g., add a stray semicolon to a TS file or a trailing whitespace), `git add` it, then `git commit -m "test: hook"` — the hook should auto-format and the commit should succeed.
2. Make an unfixable lint violation (`const x: number = "not a number";` in a test file scoped to lint), `git add`, `git commit` — the hook should abort with a clear error.
3. Reset / undo your test commits before finalizing.

## Output

Commit your work directly to `main`. Then write a short note to `docs/build/proposals/pre-commit-hook.md` listing what you shipped, the lint-staged config, and verification.

## Report back

≤150 words. Files added/modified, verification, blockers.
