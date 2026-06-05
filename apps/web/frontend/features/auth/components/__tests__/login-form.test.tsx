import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const socialSignInMock = vi.fn();
const searchParamsGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: searchParamsGet }),
}));

vi.mock("@/frontend/auth/auth-client", () => ({
  signIn: { social: (...args: unknown[]) => socialSignInMock(...args) },
}));

import { LoginForm } from "../login-form";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  socialSignInMock.mockReset();
  searchParamsGet.mockReset();
  searchParamsGet.mockImplementation(() => null);
});

describe("LoginForm", () => {
  it("renders the Google sign-in button", () => {
    render(<LoginForm />);
    expect(screen.getByText(/sign in to cardinalxchange/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeEnabled();
  });

  it("calls signIn.social with google and the next callback", async () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "next" ? "/ask" : null,
    );
    socialSignInMock.mockResolvedValueOnce({ error: null });

    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(socialSignInMock).toHaveBeenCalledWith({
        provider: "google",
        callbackURL: "/ask",
      });
    });
  });

  it("shows the API error message when signIn.social returns an error", async () => {
    socialSignInMock.mockResolvedValueOnce({
      error: { message: "OAuth is not configured." },
    });

    render(<LoginForm />);
    fireEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /oauth is not configured/i,
      );
    });
  });
});
