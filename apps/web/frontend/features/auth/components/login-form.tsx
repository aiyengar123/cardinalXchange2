"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback, type FormEvent } from "react";

import { signIn } from "@/frontend/auth/auth-client";

const STANFORD_DOMAIN = "stanford.edu";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/questions";
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = email.trim().toLowerCase();
      if (!trimmed.endsWith(`@${STANFORD_DOMAIN}`)) {
        setState({
          kind: "error",
          message: `Use your @${STANFORD_DOMAIN} email to sign in.`,
        });
        return;
      }
      setState({ kind: "submitting" });
      const { error } = await signIn.magicLink({
        email: trimmed,
        callbackURL: next,
      });
      if (error) {
        setState({
          kind: "error",
          message: error.message ?? "Could not send a magic link. Try again.",
        });
        return;
      }
      setState({ kind: "sent", email: trimmed });
    },
    [email, next],
  );

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink-900)]">
          Sign in to cardinalXchange
        </h1>
        <p className="text-sm text-[var(--color-ink-700)]">
          Stanford community only. Sign in with your @{STANFORD_DOMAIN} email.
        </p>
      </header>

      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white opacity-60 transition-colors duration-150 ease-out"
        disabled
        title="Stanford SSO will be enabled once IT shares SAML metadata"
        type="button"
      >
        Sign in with Stanford (SSO)
      </button>
      <p className="-mt-3 text-xs text-[var(--color-ink-500)]">
        Stanford SSO is rolling out. Use the email magic-link below for now.
      </p>

      <div className="flex items-center gap-3 text-xs tracking-wider text-[var(--color-ink-500)] uppercase">
        <span className="h-px flex-1 bg-[var(--color-border-default)]" />
        <span>or magic link</span>
        <span className="h-px flex-1 bg-[var(--color-border-default)]" />
      </div>

      <form
        className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border-default)] bg-white p-6"
        onSubmit={onSubmit}
      >
        <label
          className="text-sm font-medium text-[var(--color-ink-900)]"
          htmlFor="login-email"
        >
          Stanford email
        </label>
        <input
          autoComplete="email"
          className="block h-11 w-full rounded-lg border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:outline-none focus:ring-inset"
          disabled={state.kind === "submitting" || state.kind === "sent"}
          id="login-email"
          name="email"
          onChange={(event) => {
            setEmail(event.target.value);
            if (state.kind === "error") setState({ kind: "idle" });
          }}
          placeholder={`you@${STANFORD_DOMAIN}`}
          required
          type="email"
          value={email}
        />
        <button
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={state.kind === "submitting" || state.kind === "sent"}
          type="submit"
        >
          {state.kind === "submitting" ? "Sending…" : "Send magic link"}
        </button>
        {state.kind === "error" ? (
          <p className="text-sm text-[var(--color-cardinal-600)]" role="alert">
            {state.message}
          </p>
        ) : null}
        {state.kind === "sent" ? (
          <p className="text-sm text-[var(--color-ink-700)]" role="status">
            Check {state.email} for the sign-in link. It expires in 10 minutes.
          </p>
        ) : null}
      </form>

      <p className="text-xs text-[var(--color-ink-500)]">
        By signing in you agree this account is yours and you'll follow
        community guidelines.
      </p>
    </section>
  );
}

export default LoginForm;
