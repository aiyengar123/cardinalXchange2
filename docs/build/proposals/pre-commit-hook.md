# Pre-commit Hook (husky + lint-staged)

Source task: `docs/build/tasks/build-2/03-pre-commit.md`.

## Shipped

- `pnpm add -D -w husky lint-staged` — only new devDependencies (eslint + prettier already present).
- `pnpm exec husky init` — created `.husky/` and added a root `prepare: husky` script so a fresh `pnpm install` provisions hooks for new clones. Husky 9 owns the cache at `.husky/_/` and ships its own `.husky/_/.gitignore` (`*`), so the cache stays out of git without changes to the repo `.gitignore`.
- `.husky/pre-commit` — body is a single line, executable (`chmod +x`):
  ```sh
  pnpm exec lint-staged
  ```
- Root `package.json` `lint-staged` config (prettier first, then eslint):
  ```jsonc
  {
    "*.{ts,tsx,js,mjs,cjs}": ["prettier --write", "eslint --fix"],
    "*.{md,json,css,yml,yaml}": ["prettier --write"],
  }
  ```
- `CLAUDE.md` — new "Development" section documents the hook, the `prepare` provisioning step, and the no-`--no-verify` rule.
- `.prettierignore` — keeps prettier (and therefore lint-staged) off generated artifacts: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `.next/`, `.turbo/`, `dist/`, `coverage/`, `node_modules/`, `packages/db/generated/`, `*.tsbuildinfo`. Without this, staging the lockfile after a dep bump would force prettier to rewrite it.

## Not added (per task hard rules)

- No new eslint/prettier installs.
- No typecheck / vitest in the hook (kept fast — staged files only).
- No `--no-verify` bypass anywhere in committed config.

## Verification

Ran two scenarios on a throwaway scratch file (`apps/web/shared/utils/__hook_scratch__.ts`), both deleted before commit.

1. **Fixable** — staged `export   const  hookScratch    =     "trigger-prettier"   ;` (extra whitespace + stray semicolon spacing). Hook ran: `prettier --write` reformatted to `export const hookScratch = "trigger-prettier";`, `eslint --fix` clean, commit succeeded with the formatted content. Reset with `git reset --mixed HEAD~1`.
2. **Unfixable** — staged `const unusedConst = 42;`. Hook ran: prettier passed, `eslint --fix` failed with `@typescript-eslint/no-unused-vars` error, lint-staged reverted to the pre-commit state, commit aborted (exit 1) with the eslint error printed. No commit landed.

## Blockers

None.
