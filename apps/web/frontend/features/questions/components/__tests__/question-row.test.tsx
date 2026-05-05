import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { QuestionRowDto } from "@/backend/http/contracts";

import { QuestionRow } from "../question-row";

afterEach(() => {
  cleanup();
});

function row(overrides: Partial<QuestionRowDto> = {}): QuestionRowDto {
  return {
    id: "q-1",
    slug: "first-question",
    title: "First question",
    excerpt: "An excerpt of the body of the question.",
    answers: 0,
    status: "open",
    tags: [],
    author: "Alice",
    authorMeta: "CS '26",
    askedAt: "2h ago",
    activity: "needs first answer",
    ...overrides,
  };
}

describe("QuestionRow", () => {
  it("renders the title as a link to /questions/<slug>", () => {
    render(<QuestionRow question={row({ slug: "drop-cs-109" })} />);

    const link = screen.getByRole("link", { name: "First question" });
    expect(link.getAttribute("href")).toBe("/questions/drop-cs-109");
  });

  it("renders the excerpt under the title", () => {
    render(
      <QuestionRow
        question={row({ excerpt: "I want to drop CS 109 and need help." })}
      />,
    );

    expect(
      screen.getByText("I want to drop CS 109 and need help."),
    ).toBeInTheDocument();
  });

  it("renders each tag as a link to /questions?tag=<slug>", () => {
    render(
      <QuestionRow
        question={row({
          tags: [
            { slug: "wifi", label: "Wi-Fi", kind: "topic" },
            { slug: "hci", label: "HCI", kind: "topic" },
          ],
        })}
      />,
    );

    const wifi = screen.getByRole("link", { name: "Wi-Fi" });
    const hci = screen.getByRole("link", { name: "HCI" });
    expect(wifi.getAttribute("href")).toBe("/questions?tag=wifi");
    expect(hci.getAttribute("href")).toBe("/questions?tag=hci");
  });

  it("renders the author display name and asked-at meta", () => {
    render(
      <QuestionRow question={row({ author: "Stephen", askedAt: "5m ago" })} />,
    );

    expect(screen.getByText("Stephen")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("pluralizes 'answers' when count is 0", () => {
    render(<QuestionRow question={row({ answers: 0 })} />);
    expect(screen.getByText("0 answers")).toBeInTheDocument();
  });

  it("uses the singular '1 answer' when count is exactly 1", () => {
    render(<QuestionRow question={row({ answers: 1 })} />);
    expect(screen.getByText("1 answer")).toBeInTheDocument();
  });

  it("pluralizes for any count > 1", () => {
    render(<QuestionRow question={row({ answers: 7 })} />);
    expect(screen.getByText("7 answers")).toBeInTheDocument();
  });

  it("scopes the article element with the question id for in-page anchors", () => {
    const { container } = render(
      <QuestionRow question={row({ id: "q-42" })} />,
    );
    const article = container.querySelector("article");
    expect(article?.getAttribute("id")).toBe("q-42");
  });

  it("includes the title link in the article element, not outside", () => {
    const { container } = render(<QuestionRow question={row()} />);
    const article = container.querySelector("article");
    expect(article).not.toBeNull();
    if (article) {
      expect(
        within(article).getByRole("link", { name: "First question" }),
      ).toBeInTheDocument();
    }
  });
});
