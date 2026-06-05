"use client";

import { createAuthClient } from "better-auth/react";

// Type annotation intentionally widened: Better Auth's inferred client type
// references a non-portable internal symbol (`InferUserUpdateCtx`), so we
// access methods through narrow re-exports instead of via a named const.
const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const signIn = client.signIn;
export const signOut = client.signOut;
export const useSession = client.useSession;
export const getSession = client.getSession;
