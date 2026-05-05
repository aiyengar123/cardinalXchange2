import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { AskForm } from "../ask-form";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
});

describe("AskForm", () => {
  it("blocks submit and shows a 'Title is required' error when title is empty", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<AskForm />);

    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "Body content here." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Submit Question/ }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("commits a tag on Enter and removes it via the × button", () => {
    render(<AskForm />);

    const tagInput = screen.getByLabelText("Tags");
    fireEvent.change(tagInput, { target: { value: "wifi" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    // Tag chip rendered
    expect(screen.getByText("wifi")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove tag wifi" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove tag wifi" }));
    expect(screen.queryByText("wifi")).not.toBeInTheDocument();
  });

  it("POSTs to /api/questions with the title/body/tags shape and routes to the new question on success", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          question: { id: "q-new", slug: "fresh-slug" },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    render(<AskForm />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "How do I X?" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "Real body" },
    });

    const tagInput = screen.getByLabelText("Tags");
    fireEvent.change(tagInput, { target: { value: "wifi" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: /Submit Question/ }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe("/api/questions");
    expect(init?.method).toBe("POST");
    const payload = JSON.parse(init?.body as string);
    expect(payload).toEqual({
      title: "How do I X?",
      body: "Real body",
      tags: ["wifi"],
    });

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/questions/fresh-slug"),
    );
  });
});
