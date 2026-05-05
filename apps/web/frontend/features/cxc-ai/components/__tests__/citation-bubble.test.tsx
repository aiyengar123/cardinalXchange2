import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { CxcSourceDto } from "@/backend/http/contracts";

import { CitationBubble } from "../citation-bubble";

afterEach(() => {
  cleanup();
});

function source(overrides: Partial<CxcSourceDto> = {}): CxcSourceDto {
  return {
    id: "question:q-1",
    kind: "question",
    label: "Question",
    title: "Question title",
    snippet: "A short snippet.",
    questionId: "q-1",
    url: "/questions/q-1",
    ...overrides,
  };
}

describe("CitationBubble", () => {
  it("renders a Q-prefixed badge for question sources", () => {
    render(<CitationBubble index={1} source={source()} />);
    expect(screen.getByRole("button", { name: /Q1/ })).toBeInTheDocument();
  });

  it("renders an A-prefixed badge for answer sources", () => {
    render(
      <CitationBubble
        index={2}
        source={source({ kind: "answer", id: "answer:a-1" })}
      />,
    );
    expect(screen.getByRole("button", { name: /A2/ })).toBeInTheDocument();
  });

  it("opens the popover on click and links to /questions/<id> in the same tab for Q/A sources", () => {
    render(<CitationBubble index={1} source={source()} />);

    fireEvent.click(screen.getByRole("button", { name: /Q1/ }));

    const link = screen.getByRole("link", { name: /Open source/ });
    expect(link.getAttribute("href")).toBe("/questions/q-1");
    expect(link.getAttribute("target")).toBeNull();
    // Same-tab: no rel injected for internal links
    expect(link.getAttribute("rel")).toBeNull();
  });

  it("for web sources, links out to the external URL with target=_blank + rel", () => {
    render(
      <CitationBubble
        index={3}
        source={source({
          kind: "web",
          id: "web:s-3",
          url: "https://stanford.edu/article",
          questionId: "",
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /W3/ }));

    const link = screen.getByRole("link", { name: /Open source/ });
    expect(link.getAttribute("href")).toBe("https://stanford.edu/article");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });
});
