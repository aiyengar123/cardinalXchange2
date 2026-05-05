import { createTransport, type Transporter } from "nodemailer";

/**
 * Lazy SMTP transport for magic-link emails. Reads `EMAIL_SERVER_*`
 * environment variables. Returns `null` when unconfigured so callers
 * can decide what to do (dev: log to console; prod: throw).
 *
 * The transport is cached at module scope — `nodemailer.createTransport`
 * is idempotent and the underlying connection pool is reused across
 * sends.
 */

type EmailEnv = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
};

let cachedTransport: Transporter | null = null;
let cachedFrom: string | null = null;

function readEmailEnv(): EmailEnv | null {
  const host = process.env.EMAIL_SERVER_HOST?.trim();
  const portRaw = process.env.EMAIL_SERVER_PORT?.trim();
  const user = process.env.EMAIL_SERVER_USER?.trim();
  const password = process.env.EMAIL_SERVER_PASSWORD?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!host || !user || !password || !from) {
    return null;
  }

  const port = portRaw ? Number(portRaw) : 587;
  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  return { host, port, user, password, from };
}

function getTransport(): { transport: Transporter; from: string } | null {
  if (cachedTransport && cachedFrom) {
    return { transport: cachedTransport, from: cachedFrom };
  }
  const env = readEmailEnv();
  if (!env) {
    return null;
  }
  cachedTransport = createTransport({
    host: env.host,
    port: env.port,
    secure: env.port === 465,
    auth: { user: env.user, pass: env.password },
  });
  cachedFrom = env.from;
  return { transport: cachedTransport, from: env.from };
}

export type SendMagicLinkArgs = {
  to: string;
  url: string;
};

export async function sendMagicLinkEmail({
  to,
  url,
}: SendMagicLinkArgs): Promise<void> {
  const handle = getTransport();
  if (!handle) {
    throw new Error(
      "Email transport is not configured. Set EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, and EMAIL_FROM.",
    );
  }
  const { transport, from } = handle;

  const subject = "Sign in to CardinalXchange";
  const text = [
    "Click the link below to sign in to CardinalXchange.",
    "",
    url,
    "",
    "This link expires shortly. If you didn't request it, you can ignore this email.",
  ].join("\n");
  const html = renderMagicLinkHtml(url);

  await transport.sendMail({ from, to, subject, text, html });
}

function renderMagicLinkHtml(url: string): string {
  return [
    "<!doctype html>",
    '<html lang="en"><body style="font-family:Inter,system-ui,sans-serif;color:#0a0a0a;background:#ffffff;padding:24px;">',
    '<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;">',
    "<tr><td>",
    '<h1 style="font-size:20px;font-weight:600;margin:0 0 16px;">Sign in to CardinalXchange</h1>',
    '<p style="font-size:14px;line-height:1.5;color:#2a2a2a;margin:0 0 16px;">Click the button below to finish signing in. The link expires shortly.</p>',
    `<p style="margin:0 0 24px;"><a href="${escapeAttr(url)}" style="display:inline-block;background:#c8102e;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Sign in</a></p>`,
    '<p style="font-size:12px;color:#5a5a5a;margin:0 0 8px;">Or copy this URL into your browser:</p>',
    `<p style="font-size:12px;color:#5a5a5a;word-break:break-all;margin:0 0 24px;"><a href="${escapeAttr(url)}" style="color:#0b66c2;">${escapeText(url)}</a></p>`,
    '<p style="font-size:12px;color:#5a5a5a;margin:0;">If you didn\'t request this email, you can ignore it.</p>',
    "</td></tr>",
    "</table>",
    "</body></html>",
  ].join("");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
