import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { QuestionRowDto } from "@/backend/http/contracts";

import { QuestionFeed } from "../question-feed";

afterEach(() => {
  cleanup();
});

function row(overrides: Partial<QuestionRowDto> = {}): QuestionRowDto {
  return {
    id: "q-1",
    slug: "first",
    title: "First question",
    excerpt: "Excerpt",
    answers: 0,
    status: "open",
    tags: [],
    author: "Alice",
    authorMeta: "",
    askedAt: "1h ago",
    activity: "needs first answer",
    ...overrides,
  };
}

describe("QuestionFeed", () => {
  it("renders the unfiltered empty state with a link to /ask", () => {
    render(<QuestionFeed questions={[]} />);

    expect(
      screen.getByText(/No questions yet\. Be the first/),
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Ask a Question" });
    expect(link.getAttribute("href")).toBe("/ask");
  });

  it("renders a tag-filtered empty state including the tag in the message", () => {
    render(<QuestionFeed questions={[]} filter={{ tag: "eduroam" }} />);

    expect(screen.getByText(/No questions tagged/)).toBeInTheDocument();
    expect(screen.getByText("eduroam")).toBeInTheDocument();

    const askLink = screen.getByRole("link", { name: "Ask a Question" });
    expect(askLink.getAttribute("href")).toContain(
      "draft=" + encodeURIComponent(JSON.stringify({ tags: ["eduroam"] })),
    );
    expect(
      screen.getByRole("link", { name: "Clear filter" }).getAttribute("href"),
    ).toBe("/questions");
  });

  it("renders a query-filtered empty state including the query in the message", () => {
    render(<QuestionFeed questions={[]} filter={{ query: "wifi" }} />);

    expect(screen.getByText(/No questions match/)).toBeInTheDocument();
    expect(screen.getByText("wifi")).toBeInTheDocument();
    // Filtered empty state always offers an Ask link without a tag preset
    const askLink = screen.getByRole("link", { name: "Ask a Question" });
    expect(askLink.getAttribute("href")).toBe("/ask");
  });

  it("renders one row per question with stable IDs", () => {
    render(
      <QuestionFeed
        questions={[
          row({ id: "q-1", title: "How do I X?" }),
          row({ id: "q-2", title: "How do I Y?" }),
        ]}
      />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.getByText("How do I X?")).toBeInTheDocument();
    expect(screen.getByText("How do I Y?")).toBeInTheDocument();
  });

  it("does NOT render the empty state when questions are populated", () => {
    render(<QuestionFeed questions={[row()]} />);
    expect(screen.queryByText(/No questions yet/)).not.toBeInTheDocument();
  });

  it("renders an accessible labelled section with sr-only heading", () => {
    render(<QuestionFeed questions={[row()]} />);
    const heading = screen.getByRole("heading", { name: "Questions" });
    expect(heading).toBeInTheDocument();
  });

  it("threads tag links through to the questions feed query", () => {
    render(
      <QuestionFeed
        questions={[
          row({
            id: "q-1",
            tags: [{ slug: "wifi", label: "Wi-Fi", kind: "topic" }],
          }),
        ]}
      />,
    );

    const link = screen.getByRole("link", { name: "Wi-Fi" });
    expect(link.getAttribute("href")).toBe("/questions?tag=wifi");
  });
});
