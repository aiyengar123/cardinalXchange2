import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { QuestionDetailDto } from "@/backend/http/contracts";

import { QuestionDetail } from "../question-detail";

afterEach(() => {
  cleanup();
});

function detail(overrides: Partial<QuestionDetailDto> = {}): QuestionDetailDto {
  return {
    id: "q-1",
    slug: "first",
    title: "First question",
    excerpt: "...",
    answers: 0,
    status: "open",
    tags: [],
    author: "Alice",
    authorMeta: "CS '26",
    askedAt: "2h ago",
    activity: "needs first answer",
    body: "Plain body.",
    createdAt: "2026-04-01T00:00:00.000Z",
    answersList: [],
    ...overrides,
  };
}

describe("QuestionDetail", () => {
  it("renders the title as an h1", () => {
    render(<QuestionDetail question={detail({ title: "Hello world" })} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Hello world");
  });

  it("renders markdown body — bold renders as <strong>", () => {
    const { container } = render(
      <QuestionDetail question={detail({ body: "**bold** statement" })} />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("bold");
  });

  it("renders markdown links inside the body", () => {
    render(
      <QuestionDetail
        question={detail({
          body: "See [Stanford](https://stanford.edu) for details.",
        })}
      />,
    );

    const link = screen.getByRole("link", { name: "Stanford" });
    expect(link.getAttribute("href")).toBe("https://stanford.edu");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("renders tag pills as links to /questions?tag=<slug>", () => {
    render(
      <QuestionDetail
        question={detail({
          tags: [
            { slug: "wifi", label: "Wi-Fi", kind: "topic" },
            { slug: "hci", label: "HCI", kind: "topic" },
          ],
        })}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Wi-Fi" }).getAttribute("href"),
    ).toBe("/questions?tag=wifi");
    expect(screen.getByRole("link", { name: "HCI" }).getAttribute("href")).toBe(
      "/questions?tag=hci",
    );
  });

  it("omits the tags row when no tags are attached", () => {
    const { container } = render(
      <QuestionDetail question={detail({ tags: [] })} />,
    );
    // No anchor tags in the article means no tag pills
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(0);
  });

  it("renders the meta line as 'Asked by <author> · <askedAt>'", () => {
    render(
      <QuestionDetail
        question={detail({ author: "Stephen", askedAt: "10m ago" })}
      />,
    );
    expect(screen.getByText("Stephen")).toBeInTheDocument();
    expect(screen.getByText(/10m ago/)).toBeInTheDocument();
    expect(screen.getByText(/Asked by/)).toBeInTheDocument();
  });
});
