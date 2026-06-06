/**
 * Error code emitted by the auth server when a non-@stanford.edu Google
 * account attempts to register. Better Auth surfaces it on the login page
 * as `?error=<code>` after the OAuth callback rejects the sign-up.
 *
 * Must contain no spaces — Better Auth rewrites spaces to underscores in
 * the redirect, which would break the client-side match.
 */
export const STANFORD_EMAIL_REQUIRED_ERROR = "stanford_email_required";
