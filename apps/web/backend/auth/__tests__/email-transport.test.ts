import { afterEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.fn();

vi.mock("nodemailer", () => ({
  createTransport: vi.fn(() => ({
    sendMail: sendMailMock,
  })),
}));

const ENV_KEYS = [
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_FROM",
] as const;

afterEach(() => {
  vi.resetModules();
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  sendMailMock.mockReset();
});

describe("sendMagicLinkEmail", () => {
  it("throws a clear error when EMAIL_SERVER_* is unconfigured", async () => {
    const { sendMagicLinkEmail } = await import("../email-transport");

    await expect(
      sendMagicLinkEmail({
        to: "user@stanford.edu",
        url: "https://example.com/auth?token=abc",
      }),
    ).rejects.toThrow(/EMAIL_SERVER_HOST/);
  });

  it("sends an email when EMAIL_SERVER_* is fully configured", async () => {
    process.env.EMAIL_SERVER_HOST = "smtp.example.com";
    process.env.EMAIL_SERVER_PORT = "587";
    process.env.EMAIL_SERVER_USER = "user";
    process.env.EMAIL_SERVER_PASSWORD = "secret";
    process.env.EMAIL_FROM = "no-reply@example.com";

    sendMailMock.mockResolvedValueOnce({});

    const { sendMagicLinkEmail } = await import("../email-transport");

    await sendMagicLinkEmail({
      to: "user@stanford.edu",
      url: "https://example.com/auth?token=abc",
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const call = sendMailMock.mock.calls[0]?.[0];
    expect(call).toBeTruthy();
    expect(call.from).toBe("no-reply@example.com");
    expect(call.to).toBe("user@stanford.edu");
    expect(call.subject).toContain("Sign in");
    expect(call.text).toContain("https://example.com/auth?token=abc");
    expect(call.html).toContain("https://example.com/auth?token=abc");
  });

  it("throws when EMAIL_FROM is missing even if other vars are set", async () => {
    process.env.EMAIL_SERVER_HOST = "smtp.example.com";
    process.env.EMAIL_SERVER_PORT = "587";
    process.env.EMAIL_SERVER_USER = "user";
    process.env.EMAIL_SERVER_PASSWORD = "secret";
    // EMAIL_FROM intentionally absent

    const { sendMagicLinkEmail } = await import("../email-transport");

    await expect(
      sendMagicLinkEmail({
        to: "user@stanford.edu",
        url: "https://example.com/auth?token=abc",
      }),
    ).rejects.toThrow(/EMAIL_SERVER_HOST/);
  });
});
