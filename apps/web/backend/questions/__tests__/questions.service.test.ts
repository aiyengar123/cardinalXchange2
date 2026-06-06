import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@cardinalxchange/db", () => ({
  listQuestionRecords: vi.fn(),
  getQuestionRecord: vi.fn(),
  createQuestionRecord: vi.fn(),
}));

vi.mock("@/backend/viewer", () => ({
  getViewer: vi.fn(async () => ({
    id: "u-test",
    displayName: "Stanford Student",
    meta: "Dev viewer",
    role: "student" as const,
    source: "dev" as const,
    isAuthenticated: true,
  })),
  ANONYMOUS_VIEWER: {
    id: "anonymous",
    displayName: "Stanford community member",
    meta: "Anonymous",
    role: "student" as const,
    source: "anonymous" as const,
    isAuthenticated: false,
  },
}));

import { getViewer } from "@/backend/viewer";

import {
  createQuestionRecord,
  getQuestionRecord,
  listQuestionRecords,
} from "@cardinalxchange/db";

import { HttpError } from "@/backend/http/http";
import {
  createQuestion,
  getQuestionDetail,
  listQuestionsForFeed,
} from "../questions.service";

type Mocked<T> = T & ReturnType<typeof vi.fn>;
const list = listQuestionRecords as unknown as Mocked<
  typeof listQuestionRecords
>;
const get = getQuestionRecord as unknown as Mocked<typeof getQuestionRecord>;
const create = createQuestionRecord as unknown as Mocked<
  typeof createQuestionRecord
>;

function feedRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "q-1",
    slug: "how-do-i-x",
    title: "How do I X?",
    body: "I want to do X but it's not working.",
    status: "OPEN" as const,
    authorName: "Asker",
    authorMeta: "CS '26",
    searchText: null,
    createdAt: new Date("2026-04-01T00:00:00Z"),
    updatedAt: new Date("2026-04-01T00:00:00Z"),
    lastActivityAt: new Date("2026-04-01T00:00:00Z"),
    tags: [],
    answers: [],
    _count: { answers: 0 },
    ...overrides,
  };
}

function detailRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "q-1",
    slug: "how-do-i-x",
    title: "How do I X?",
    body: "Long body explaining the question.",
    status: "OPEN" as const,
    authorName: "Asker",
    authorMeta: "CS '26",
    searchText: null,
    createdAt: new Date("2026-04-01T00:00:00Z"),
    updatedAt: new Date("2026-04-01T00:00:00Z"),
    lastActivityAt: new Date("2026-04-01T00:00:00Z"),
    tags: [],
    answers: [],
    _count: { answers: 0 },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listQuestionsForFeed", () => {
  it("returns an empty array when the DB returns no records", async () => {
    list.mockResolvedValueOnce([]);

    const result = await listQuestionsForFeed();

    expect(result).toEqual([]);
    expect(list).toHaveBeenCalledWith({ tag: undefined, sort: "newest" });
  });

  it("maps feed records into summary DTOs", async () => {
    list.mockResolvedValueOnce([
      feedRecord({
        id: "q-1",
        slug: "first",
        title: "First",
        body: "body 1",
      }),
      feedRecord({
        id: "q-2",
        slug: "second",
        title: "Second",
        body: "body 2",
        _count: { answers: 1 },
        answers: [
          {
            id: "a-1",
            questionId: "q-2",
            body: "answer body",
            authorName: "Helper",
            authorMeta: "MS '25",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }),
    ]);

    const result = await listQuestionsForFeed();

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("q-1");
    expect(result[0]?.answers).toBe(0);
    expect(result[1]?.id).toBe("q-2");
    expect(result[1]?.answers).toBe(1);
    expect(result[1]?.activity).toMatch(/new answer/);
  });

  it("forwards a tag filter through to the DB call", async () => {
    list.mockResolvedValueOnce([]);

    await listQuestionsForFeed({ tag: "algorithms" });

    expect(list).toHaveBeenCalledWith({ tag: "algorithms", sort: "newest" });
  });

  it("defaults sort to 'newest' but respects an explicit sort", async () => {
    list.mockResolvedValueOnce([]);
    await listQuestionsForFeed({ sort: "newest" });
    expect(list).toHaveBeenLastCalledWith({ tag: undefined, sort: "newest" });

    list.mockResolvedValueOnce([]);
    await listQuestionsForFeed({ sort: "unanswered" });
    expect(list).toHaveBeenLastCalledWith({
      tag: undefined,
      sort: "unanswered",
    });
  });
});

describe("getQuestionDetail", () => {
  it("returns the detail DTO when the record is found", async () => {
    get.mockResolvedValueOnce(detailRecord());

    const result = await getQuestionDetail("how-do-i-x");

    expect(result.id).toBe("q-1");
    expect(result.body).toBe("Long body explaining the question.");
    expect(result.answersList).toEqual([]);
  });

  it("throws an HttpError(404, question_not_found) when not found", async () => {
    get.mockResolvedValueOnce(null);

    await expect(getQuestionDetail("missing")).rejects.toBeInstanceOf(
      HttpError,
    );

    get.mockResolvedValueOnce(null);
    try {
      await getQuestionDetail("missing");
    } catch (err) {
      const httpError = err as HttpError;
      expect(httpError.status).toBe(404);
      expect(httpError.code).toBe("question_not_found");
    }
  });

  it("includes answers in the order returned by the DB", async () => {
    get.mockResolvedValueOnce(
      detailRecord({
        _count: { answers: 2 },
        answers: [
          {
            id: "a-1",
            questionId: "q-1",
            body: "first answer",
            authorName: "A",
            authorMeta: "",
            createdAt: new Date("2026-04-01T00:00:00Z"),
            updatedAt: new Date("2026-04-01T00:00:00Z"),
            votes: [],
          },
          {
            id: "a-2",
            questionId: "q-1",
            body: "second answer",
            authorName: "B",
            authorMeta: "",
            createdAt: new Date("2026-04-02T00:00:00Z"),
            updatedAt: new Date("2026-04-02T00:00:00Z"),
            votes: [],
          },
        ],
      }),
    );

    const result = await getQuestionDetail("q-1");

    expect(result.answersList.map((a) => a.id)).toEqual(["a-1", "a-2"]);
    expect(result.answers).toBe(2);
  });
});

describe("createQuestion", () => {
  it("persists then re-reads through getQuestionDetail and returns the DTO", async () => {
    create.mockResolvedValueOnce(detailRecord({ id: "q-new", slug: "new" }));
    get.mockResolvedValueOnce(detailRecord({ id: "q-new", slug: "new" }));

    const dto = await createQuestion({
      title: "New question",
      body: "Body content",
      tags: ["tagged"],
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.[0]).toMatchObject({
      title: "New question",
      body: "Body content",
      tags: ["tagged"],
    });
    expect(get).toHaveBeenCalledWith("q-new");
    expect(dto.id).toBe("q-new");
  });

  it("falls back to viewer.displayName when authorDisplayName is omitted", async () => {
    create.mockResolvedValueOnce(detailRecord({ id: "q-2" }));
    get.mockResolvedValueOnce(detailRecord({ id: "q-2" }));

    await createQuestion({
      title: "Hi",
      body: "Body",
      tags: [],
    });

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      authorName: "Stanford Student",
    });
  });

  it("uses the supplied authorDisplayName when provided", async () => {
    create.mockResolvedValueOnce(detailRecord({ id: "q-3" }));
    get.mockResolvedValueOnce(detailRecord({ id: "q-3" }));

    await createQuestion({
      title: "Hi",
      body: "Body",
      tags: [],
      authorDisplayName: "Custom Person",
      authorMeta: "Custom Meta",
    });

    expect(create.mock.calls[0]?.[0]).toMatchObject({
      authorName: "Custom Person",
      authorMeta: "Custom Meta",
    });
  });

  it("rejects with HttpError(401) when the viewer is not authenticated", async () => {
    (getViewer as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "anonymous",
      displayName: "Stanford community member",
      meta: "Anonymous",
      role: "student",
      source: "anonymous",
      isAuthenticated: false,
    });

    await expect(
      createQuestion({ title: "Q", body: "B", tags: [] }),
    ).rejects.toBeInstanceOf(HttpError);
    expect(create).not.toHaveBeenCalled();
  });

  it("threads the viewer id into the persisted authorId", async () => {
    create.mockResolvedValueOnce(detailRecord({ id: "q-4" }));
    get.mockResolvedValueOnce(detailRecord({ id: "q-4" }));

    await createQuestion({ title: "Q", body: "B", tags: [] });

    expect(create.mock.calls[0]?.[0]).toMatchObject({ authorId: "u-test" });
  });
});
