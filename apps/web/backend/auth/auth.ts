import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@cardinalxchange/db";

import { STANFORD_EMAIL_REQUIRED_ERROR } from "@/data/auth-errors.data";

const STANFORD_EMAIL_PATTERN = /@stanford\.edu$/i;

export function isStanfordEmail(email: string): boolean {
  return STANFORD_EMAIL_PATTERN.test(email.trim());
}

function readGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

const googleOAuth = readGoogleOAuthConfig();

export const auth = betterAuth({
  appName: "CardinalXchange",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: false },
  socialProviders: googleOAuth
    ? {
        google: {
          ...googleOAuth,
          // Hint Google's account picker to stanford.edu accounts only.
          // UX nicety — real enforcement is the user.create hook below.
          hd: "stanford.edu",
        },
      }
    : undefined,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isStanfordEmail(user.email)) {
            // The message doubles as the `?error=` code on the OAuth
            // redirect back to /login, so it must stay a stable slug.
            throw new APIError("FORBIDDEN", {
              message: STANFORD_EMAIL_REQUIRED_ERROR,
            });
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});

export function isGoogleOAuthConfigured(): boolean {
  return googleOAuth !== null;
}
