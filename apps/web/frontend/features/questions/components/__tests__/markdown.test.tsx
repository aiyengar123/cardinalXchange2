import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Markdown } from "../markdown";

afterEach(() => {
  cleanup();
});

describe("Markdown", () => {
  it("renders bold, italic, and inline code as the right tags", () => {
    const { container } = render(
      <Markdown source="**bold** and *italic* and `code`" />,
    );

    const strong = container.querySelector("strong");
    const em = container.querySelector("em");
    const code = container.querySelector("code");

    expect(strong?.textContent).toBe("bold");
    expect(em?.textContent).toBe("italic");
    expect(code?.textContent).toBe("code");
  });

  it("renders a numbered list as an <ol> with one <li> per item", () => {
    const { container } = render(
      <Markdown source={"1. first\n2. second\n3. third"} />,
    );

    const list = container.querySelector("ol");
    expect(list).not.toBeNull();
    const items = list ? Array.from(list.querySelectorAll("li")) : [];
    expect(items.map((node) => node.textContent)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("renders an unordered list as a <ul> with one <li> per item", () => {
    const { container } = render(
      <Markdown source={"- alpha\n- beta\n- gamma"} />,
    );

    const list = container.querySelector("ul");
    expect(list).not.toBeNull();
    const items = list ? Array.from(list.querySelectorAll("li")) : [];
    expect(items.map((node) => node.textContent)).toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it("renders bare http links as anchors with rel and target attrs", () => {
    render(<Markdown source="See https://stanford.edu for details." />);

    const link = screen.getByRole("link", { name: "https://stanford.edu" });
    expect(link.getAttribute("href")).toBe("https://stanford.edu");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noreferrer");
  });

  it("renders [text](url) links with the visible text but the actual href", () => {
    render(<Markdown source="[Stanford](https://stanford.edu)" />);

    const link = screen.getByRole("link", { name: "Stanford" });
    expect(link.getAttribute("href")).toBe("https://stanford.edu");
  });

  it("renders fenced code blocks as <pre><code> preserving content verbatim", () => {
    const source = "```ts\nconst x = 1;\nconst y = 2;\n```";
    const { container } = render(<Markdown source={source} />);

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    const code = pre?.querySelector("code");
    expect(code?.textContent).toBe("const x = 1;\nconst y = 2;");
    expect(code?.className).toContain("language-ts");
  });

  it("omits the language- class when no language hint is given", () => {
    const source = "```\nplain code\n```";
    const { container } = render(<Markdown source={source} />);
    const code = container.querySelector("pre code");
    expect(code?.textContent).toBe("plain code");
    expect(code?.className ?? "").not.toContain("language-");
  });

  it("renders blockquotes as <blockquote> elements", () => {
    const { container } = render(
      <Markdown source={"> first quoted line\n> second line"} />,
    );
    const bq = container.querySelector("blockquote");
    expect(bq).not.toBeNull();
    expect(bq?.textContent).toContain("first quoted line");
    expect(bq?.textContent).toContain("second line");
  });

  it("renders pipe tables as <table> with header + body rows", () => {
    const source = [
      "| a | b |",
      "| --- | --- |",
      "| 1 | 2 |",
      "| 3 | 4 |",
    ].join("\n");
    const { container } = render(<Markdown source={source} />);

    const table = container.querySelector("table");
    expect(table).not.toBeNull();
    const headers = table?.querySelectorAll("th") ?? [];
    expect(Array.from(headers).map((h) => h.textContent)).toEqual(["a", "b"]);
    const rows = table?.querySelectorAll("tbody tr") ?? [];
    expect(rows.length).toBe(2);
    expect(rows[0]?.querySelectorAll("td")[0]?.textContent).toBe("1");
    expect(rows[0]?.querySelectorAll("td")[1]?.textContent).toBe("2");
  });
});
