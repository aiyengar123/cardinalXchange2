"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

import { signOut, useSession } from "@/frontend/auth/auth-client";

/**
 * Avatar + dropdown user menu shown to the right of the search field on
 * the top bar. Replaces the "Sign in" link when a session is active.
 *
 * When signed out, renders a "Sign in" link instead and the Ask Question
 * CTA in the top bar redirects through `/login?next=/ask`.
 */
export function UserMenu() {
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }, [router]);

  if (session.isPending) {
    return (
      <div
        className="h-9 w-9 rounded-full bg-[var(--color-ink-100)]"
        aria-hidden
      />
    );
  }

  if (!session.data) {
    return (
      <Link
        className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-border-default)] bg-white px-4 text-sm font-medium text-[var(--color-ink-900)] transition-colors duration-150 ease-out hover:bg-[var(--color-ink-50)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:outline-none"
        href="/login"
      >
        Sign in
      </Link>
    );
  }

  const user = session.data.user;
  const label = (user.name?.trim() || user.email).slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cardinal-500)] text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-cardinal-600)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {user.image ? (
          <img
            alt=""
            className="h-9 w-9 rounded-full object-cover"
            src={user.image}
          />
        ) : (
          label
        )}
      </button>
      {open ? (
        <div
          className="absolute top-11 right-0 z-40 w-56 overflow-hidden rounded-lg border border-[var(--color-border-default)] bg-white shadow-lg"
          role="menu"
        >
          <div className="border-b border-[var(--color-border-default)] px-4 py-3">
            <div className="text-sm font-semibold text-[var(--color-ink-900)]">
              {user.name?.trim() || "Stanford community member"}
            </div>
            <div className="truncate text-xs text-[var(--color-ink-500)]">
              {user.email}
            </div>
          </div>
          <Link
            className="block cursor-pointer px-4 py-2 text-sm font-normal text-[var(--color-ink-900)] hover:bg-[var(--color-ink-50)]"
            href={`/users/${user.id}`}
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Your profile
          </Link>
          <Link
            className="block cursor-pointer px-4 py-2 text-sm font-normal text-[var(--color-ink-900)] hover:bg-[var(--color-ink-50)]"
            href="/settings"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Settings
          </Link>
          <button
            className="block w-full cursor-pointer px-4 py-2 text-left text-sm font-normal text-[var(--color-ink-900)] hover:bg-[var(--color-ink-50)]"
            onClick={handleSignOut}
            role="menuitem"
            type="button"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;
