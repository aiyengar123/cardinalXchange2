import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@cardinalxchange/db";

import { sendMagicLinkEmail } from "./email-transport";

const STANFORD_DOMAIN = "stanford.edu";

function isStanfordEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  return email.slice(at + 1).toLowerCase() === STANFORD_DOMAIN;
}

function isEmailTransportConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_SERVER_HOST?.trim() &&
    process.env.EMAIL_SERVER_USER?.trim() &&
    process.env.EMAIL_SERVER_PASSWORD?.trim() &&
    process.env.EMAIL_FROM?.trim(),
  );
}

export const auth = betterAuth({
  appName: "CardinalXchange",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (!isStanfordEmail(email)) {
          throw new Error(
            "Magic-link sign-in is restricted to stanford.edu addresses.",
          );
        }

        // If EMAIL_SERVER_* is configured, use the SMTP transport (works
        // in dev OR prod — set EMAIL_SERVER_HOST against Mailtrap if you
        // want to test the real flow locally).
        if (isEmailTransportConfigured()) {
          await sendMagicLinkEmail({ to: email, url });
          return;
        }

        // No transport configured. In dev, log the link so it can be
        // copied from the server console. In prod, fail loudly so the
        // operator knows the deploy is incomplete.
        if (process.env.NODE_ENV !== "production") {
          console.log(`[auth] Magic link for ${email}: ${url}`);
          return;
        }
        throw new Error(
          "Email transport is not configured. Set EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, and EMAIL_FROM.",
        );
      },
    }),
    nextCookies(),
  ],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"],
});
