"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

import { signIn } from "@/frontend/auth/auth-client";
import { STANFORD_EMAIL_REQUIRED_ERROR } from "@/data/auth-errors.data";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

function oauthErrorMessage(code: string): string {
  if (code === STANFORD_EMAIL_REQUIRED_ERROR) {
    return "Only @stanford.edu Google accounts can sign in. Pick your Stanford account and try again.";
  }
  return "Could not sign in with Google. Try again.";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") ?? "/questions";
  const oauthError = searchParams?.get("error") ?? null;
  const [state, setState] = useState<FormState>(
    oauthError
      ? { kind: "error", message: oauthErrorMessage(oauthError) }
      : { kind: "idle" },
  );

  const onGoogleSignIn = useCallback(async () => {
    setState({ kind: "submitting" });
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: `/login?next=${encodeURIComponent(next)}`,
    });
    if (error) {
      setState({
        kind: "error",
        message: error.message ?? "Could not sign in with Google. Try again.",
      });
    }
  }, [next]);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-ink-900)]">
          Sign in to cardinalXchange
        </h1>
        <p className="text-sm text-[var(--color-ink-700)]">
          Use your Stanford Google account (@stanford.edu) to sign in.
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--color-border-default)] bg-white p-6">
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border-default)] bg-white px-4 text-sm font-semibold text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={state.kind === "submitting"}
          onClick={onGoogleSignIn}
          type="button"
        >
          {state.kind === "submitting"
            ? "Redirecting…"
            : "Continue with Google"}
        </button>
        {state.kind === "error" ? (
          <p
            className="mt-3 text-sm text-[var(--color-cardinal-600)]"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <p className="text-xs text-[var(--color-ink-500)]">
        By signing in you agree this account is yours and you'll follow
        community guidelines.
      </p>
    </section>
  );
}

export default LoginForm;
