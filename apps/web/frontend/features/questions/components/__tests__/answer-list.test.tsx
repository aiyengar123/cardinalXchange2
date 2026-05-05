import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { AnswerDto } from "@/backend/http/contracts";

import { AnswerList } from "../answer-list";

afterEach(() => {
  cleanup();
});

function answer(overrides: Partial<AnswerDto> = {}): AnswerDto {
  return {
    id: "a-1",
    questionId: "q-1",
    body: "Default answer body.",
    author: "Alice",
    authorMeta: "CS '26",
    createdAt: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AnswerList", () => {
  it("renders an empty state with the 'Answers' heading and helper copy", () => {
    render(<AnswerList answers={[]} />);

    expect(
      screen.getByRole("heading", { name: "Answers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No answers yet. Add the first one below."),
    ).toBeInTheDocument();
  });

  it("renders 'Answers (N)' when answers are present", () => {
    render(
      <AnswerList
        answers={[
          answer({ id: "a-1", body: "first" }),
          answer({ id: "a-2", body: "second" }),
        ]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Answers (2)" }),
    ).toBeInTheDocument();
  });

  it("renders one list item per answer in given order", () => {
    render(
      <AnswerList
        answers={[
          answer({ id: "a-1", body: "first answer" }),
          answer({ id: "a-2", body: "second answer" }),
          answer({ id: "a-3", body: "third answer" }),
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("first answer");
    expect(items[1]).toHaveTextContent("second answer");
    expect(items[2]).toHaveTextContent("third answer");
  });

  it("renders the answer author meta line", () => {
    render(<AnswerList answers={[answer({ author: "Stephen" })]} />);
    expect(screen.getByText("Stephen")).toBeInTheDocument();
    expect(screen.getByText(/Answer by/)).toBeInTheDocument();
  });

  it("renders markdown bold/italic from answer body", () => {
    const { container } = render(
      <AnswerList
        answers={[answer({ body: "this is **bold** and *italic*" })]}
      />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");
  });

  it("falls back to raw value if createdAt cannot be parsed", () => {
    render(<AnswerList answers={[answer({ createdAt: "not-a-date" })]} />);
    expect(screen.getByText(/not-a-date/)).toBeInTheDocument();
  });
});
