import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const magicLinkMock = vi.fn();
const searchParamsGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsGet }),
}));

vi.mock("@/frontend/auth/auth-client", () => ({
  signIn: { magicLink: (...args: unknown[]) => magicLinkMock(...args) },
}));

import { LoginForm } from "../login-form";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  magicLinkMock.mockReset();
  searchParamsGet.mockReset();
  searchParamsGet.mockImplementation(() => null);
});

describe("LoginForm", () => {
  it("renders the Stanford SSO placeholder and the magic-link form", () => {
    render(<LoginForm />);
    expect(screen.getByText(/sign in to cardinalxchange/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in with stanford/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /send magic link/i }),
    ).toBeEnabled();
  });

  it("blocks submit and shows an error for non-stanford emails", async () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/stanford email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /send magic link/i }).closest("form")!,
    );
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/stanford\.edu/);
    });
    expect(magicLinkMock).not.toHaveBeenCalled();
  });

  it("calls signIn.magicLink with the trimmed email and the next callback", async () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "next" ? "/ask" : null,
    );
    magicLinkMock.mockResolvedValueOnce({ error: null });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/stanford email/i), {
      target: { value: "  Alice@stanford.edu " },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /send magic link/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(magicLinkMock).toHaveBeenCalledWith({
        email: "alice@stanford.edu",
        callbackURL: "/ask",
      });
    });
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /alice@stanford\.edu/,
      );
    });
  });

  it("shows the API error message when signIn.magicLink returns an error", async () => {
    magicLinkMock.mockResolvedValueOnce({
      error: { message: "Rate limited." },
    });

    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/stanford email/i), {
      target: { value: "alice@stanford.edu" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: /send magic link/i }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/rate limited/i);
    });
  });
});
