"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, type FormEvent } from "react";

import { signOut } from "@/frontend/auth/auth-client";

type Props = {
  userId: string;
  email: string;
  defaultDisplayName: string;
};

export function SettingsForm({ email, defaultDisplayName }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [savingState, setSavingState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteState, setDeleteState] = useState<"idle" | "deleting" | "error">(
    "idle",
  );

  const onSave = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSavingState("saving");
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!response.ok) {
        setSavingState("error");
        setErrorMessage("Could not save changes. Try again.");
        return;
      }
      setSavingState("saved");
      router.refresh();
    },
    [displayName, router],
  );

  const onDelete = useCallback(async () => {
    if (confirmDelete.trim().toLowerCase() !== "delete") return;
    setDeleteState("deleting");
    const response = await fetch("/api/users/me", { method: "DELETE" });
    if (!response.ok) {
      setDeleteState("error");
      return;
    }
    await signOut();
    router.push("/");
    router.refresh();
  }, [confirmDelete, router]);

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-6"
        onSubmit={onSave}
      >
        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium text-[var(--color-ink-900)]"
            htmlFor="settings-displayName"
          >
            Display name
          </label>
          <p className="text-xs text-[var(--color-ink-500)]">
            Shown on your questions and answers. If empty, falls back to your
            Stanford profile name.
          </p>
        </div>
        <input
          className="block h-11 w-full rounded-lg border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-ink-900)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:outline-none focus:ring-inset"
          id="settings-displayName"
          maxLength={80}
          name="displayName"
          onChange={(event) => {
            setDisplayName(event.target.value);
            if (savingState !== "idle") setSavingState("idle");
          }}
          type="text"
          value={displayName}
        />

        <div className="flex flex-col gap-1">
          <label
            className="text-sm font-medium text-[var(--color-ink-900)]"
            htmlFor="settings-email"
          >
            Email
          </label>
          <p className="text-xs text-[var(--color-ink-500)]">
            Locked to your Stanford email. Contact support to change it.
          </p>
        </div>
        <input
          className="block h-11 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-ink-700)]"
          disabled
          id="settings-email"
          type="email"
          value={email}
        />

        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-cardinal-500)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={savingState === "saving"}
            type="submit"
          >
            {savingState === "saving" ? "Saving…" : "Save changes"}
          </button>
          {savingState === "saved" ? (
            <span className="text-sm text-[var(--color-ink-700)]" role="status">
              Saved.
            </span>
          ) : null}
          {savingState === "error" ? (
            <span
              className="text-sm text-[var(--color-cardinal-600)]"
              role="alert"
            >
              {errorMessage}
            </span>
          ) : null}
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-cardinal-500)] bg-white p-6">
        <h2 className="text-base font-semibold text-[var(--color-cardinal-600)]">
          Delete account
        </h2>
        <p className="text-sm text-[var(--color-ink-700)]">
          This soft-deletes your account: your name and email are scrubbed but
          your past questions and answers stay on the forum so threads remain
          readable. Type <strong>delete</strong> to confirm.
        </p>
        <input
          className="block h-11 w-full rounded-lg border border-[var(--color-border-default)] bg-white px-3 text-sm text-[var(--color-ink-900)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-border-focus)] focus:outline-none focus:ring-inset"
          onChange={(event) => setConfirmDelete(event.target.value)}
          placeholder="Type 'delete' to confirm"
          type="text"
          value={confirmDelete}
        />
        <div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-cardinal-600)] px-4 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-700)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              confirmDelete.trim().toLowerCase() !== "delete" ||
              deleteState === "deleting"
            }
            onClick={onDelete}
            type="button"
          >
            {deleteState === "deleting" ? "Deleting…" : "Delete my account"}
          </button>
        </div>
        {deleteState === "error" ? (
          <p className="text-sm text-[var(--color-cardinal-600)]" role="alert">
            Could not delete the account. Try again.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default SettingsForm;
