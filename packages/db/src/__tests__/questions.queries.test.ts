import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({
  prisma: {
    question: { findMany: vi.fn() },
  },
}));

import {
  normalizeTagLabels,
  searchQuestionRecords,
  slugify,
} from "../questions.queries";

import { prisma } from "../client";

const questionFindMany = prisma.question.findMany as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  questionFindMany.mockReset();
  questionFindMany.mockResolvedValue([]);
});

describe("slugify", () => {
  it("lowercases and hyphenates a simple title", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses runs of non-alphanumeric characters into a single hyphen", () => {
    expect(slugify("CS 109 ---  Probability!!!")).toBe("cs-109-probability");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("   --machine learning--   ")).toBe("machine-learning");
  });

  it("returns an empty string when there is nothing slug-worthy", () => {
    expect(slugify("")).toBe("");
    expect(slugify("###")).toBe("");
  });

  it("strips characters outside the ASCII alphanumeric set, including unicode", () => {
    // The current slugify only preserves [a-z0-9]; unicode is dropped, not transliterated.
    expect(slugify("Café Latté")).toBe("caf-latt");
  });

  it("caps slug length at 72 characters", () => {
    const long = "a".repeat(200);
    const result = slugify(long);
    expect(result.length).toBe(72);
    expect(result).toBe("a".repeat(72));
  });
});

describe("normalizeTagLabels", () => {
  it("trims whitespace and computes slugs", () => {
    expect(normalizeTagLabels(["  Algorithms  ", "Data Structures"])).toEqual([
      { label: "Algorithms", slug: "algorithms" },
      { label: "Data Structures", slug: "data-structures" },
    ]);
  });

  it("dedupes by slug, keeping the first occurrence's label", () => {
    expect(
      normalizeTagLabels(["Machine Learning", "machine-learning", "ML"]),
    ).toEqual([
      { label: "Machine Learning", slug: "machine-learning" },
      { label: "ML", slug: "ml" },
    ]);
  });

  it("drops empty and whitespace-only entries", () => {
    expect(normalizeTagLabels(["", "   ", "Stats"])).toEqual([
      { label: "Stats", slug: "stats" },
    ]);
  });

  it("drops entries whose slug ends up empty", () => {
    // "###" trims non-empty but slugifies to ""
    expect(normalizeTagLabels(["###", "Linear Algebra"])).toEqual([
      { label: "Linear Algebra", slug: "linear-algebra" },
    ]);
  });

  it("returns an empty array for an empty input", () => {
    expect(normalizeTagLabels([])).toEqual([]);
  });
});

function fakeQuestion(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "q-1",
    slug: "slug-1",
    title: "Question title",
    body: "Question body content.",
    status: "OPEN" as const,
    authorName: "A",
    authorMeta: null,
    searchText: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActivityAt: new Date(),
    tags: [],
    answers: [],
    _count: { answers: 0 },
    ...overrides,
  };
}

describe("searchQuestionRecords", () => {
  it("matches multi-word queries per term, not as one verbatim phrase", async () => {
    // Regression: the CXC AI tool sends queries like "quiet study space";
    // requiring the whole phrase as a single substring returned 0 sources.
    await searchQuestionRecords({ query: "quiet study space" });

    const where = questionFindMany.mock.calls[0]?.[0]?.where;
    const orFilters = JSON.stringify(where?.AND?.[0]?.OR);
    expect(orFilters).toContain('"contains":"quiet"');
    expect(orFilters).toContain('"contains":"study"');
    expect(orFilters).toContain('"contains":"space"');
    expect(orFilters).not.toContain('"contains":"quiet study space"');
  });

  it("falls back to the raw query when no term survives tokenization", async () => {
    await searchQuestionRecords({ query: "a" });

    const where = questionFindMany.mock.calls[0]?.[0]?.where;
    expect(JSON.stringify(where?.AND?.[0]?.OR)).toContain('"contains":"a"');
  });

  it("ranks a whole-phrase title hit above scattered per-term hits", async () => {
    questionFindMany.mockResolvedValueOnce([
      fakeQuestion({
        id: "scattered",
        title: "Quiet dorms with study lounges",
        body: "There is space in the basement.",
      }),
      fakeQuestion({
        id: "phrase",
        title: "Best quiet study space on campus",
      }),
    ]);

    const results = await searchQuestionRecords({ query: "quiet study space" });
    expect(results.map((question) => question.id)).toEqual([
      "phrase",
      "scattered",
    ]);
  });

  it("still ranks questions matching only one term", async () => {
    questionFindMany.mockResolvedValueOnce([
      fakeQuestion({ id: "miss", title: "Unrelated", body: "Nothing here." }),
      fakeQuestion({
        id: "hit",
        title: "Where are the food spots?",
        body: "Coupa is solid.",
      }),
    ]);

    const results = await searchQuestionRecords({
      query: "food recommendations downtown",
    });
    expect(results[0]?.id).toBe("hit");
  });
});
