import { getUserDisplayName } from "@cardinalxchange/db";

import { getViewerFromSession } from "@/backend/auth";

export type Viewer = {
  id: string;
  displayName: string;
  meta: string;
  role: "student" | "moderator";
  source: "session" | "anonymous" | "dev";
  isAuthenticated: boolean;
};

export const ANONYMOUS_VIEWER: Viewer = {
  id: "anonymous",
  displayName: "Stanford community member",
  meta: "Anonymous",
  role: "student",
  source: "anonymous",
  isAuthenticated: false,
};

/**
 * Returns the current viewer. Resolution order:
 *   1. Live Better Auth session (`session` table cookie).
 *   2. `DEV_VIEWER_*` env vars — only honored when `AUTH_DEV_BYPASS=1`,
 *      so production never silently falls back to a stub identity.
 *   3. Anonymous viewer (read-only fallback).
 *
 * Routes that need a logged-in user should check `viewer.isAuthenticated`
 * and 401 when false. This is the only seam the rest of the backend uses
 * to read identity — no service should call `auth()` / `auth.api.getSession()`
 * directly.
 */
export async function getViewer(): Promise<Viewer> {
  const session = await getViewerFromSession();
  if (session) {
    const displayName =
      (await getUserDisplayName(session.userId)) ??
      (session.name?.trim() || session.email);
    return {
      id: session.userId,
      displayName,
      meta: session.email,
      role: "student",
      source: "session",
      isAuthenticated: true,
    };
  }

  if (process.env.AUTH_DEV_BYPASS === "1") {
    return {
      id: process.env.DEV_VIEWER_ID ?? "dev-viewer",
      displayName: process.env.DEV_VIEWER_NAME ?? "Stanford Student",
      meta: process.env.DEV_VIEWER_META ?? "Dev viewer",
      role: "student",
      source: "dev",
      isAuthenticated: true,
    };
  }

  return ANONYMOUS_VIEWER;
}
