import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@cardinalxchange/db", () => ({
  createAnswerRecord: vi.fn(),
  listAnswerRecords: vi.fn(),
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

import { createAnswerRecord, listAnswerRecords } from "@cardinalxchange/db";
import { getViewer } from "@/backend/viewer";

import { HttpError } from "@/backend/http/http";
import { addAnswer, listAnswers } from "../answers.service";

type Mocked<T> = T & ReturnType<typeof vi.fn>;
const create = createAnswerRecord as unknown as Mocked<
  typeof createAnswerRecord
>;
const list = listAnswerRecords as unknown as Mocked<typeof listAnswerRecords>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("addAnswer", () => {
  it("returns an answer DTO on success, echoing the questionId", async () => {
    create.mockResolvedValueOnce({
      id: "a-1",
      questionId: "q-1",
      body: "answer body",
      authorName: "Alice",
      authorMeta: "PhD '27",
      createdAt: new Date("2026-04-01T00:00:00Z"),
      updatedAt: new Date("2026-04-01T00:00:00Z"),
    });

    const dto = await addAnswer("q-1", { body: "answer body" });

    expect(dto).toEqual({
      id: "a-1",
      questionId: "q-1",
      body: "answer body",
      author: "Alice",
      authorMeta: "PhD '27",
      createdAt: "2026-04-01T00:00:00.000Z",
      voteScore: 0,
      viewerVote: 0,
    });
  });

  it("throws HttpError(404, question_not_found) when the question is missing", async () => {
    create.mockResolvedValueOnce(null);

    await expect(addAnswer("missing", { body: "x" })).rejects.toBeInstanceOf(
      HttpError,
    );

    create.mockResolvedValueOnce(null);
    try {
      await addAnswer("missing", { body: "x" });
    } catch (err) {
      const httpError = err as HttpError;
      expect(httpError.status).toBe(404);
      expect(httpError.code).toBe("question_not_found");
    }
  });

  it("falls back to viewer.displayName when authorDisplayName is omitted", async () => {
    create.mockResolvedValueOnce({
      id: "a-2",
      questionId: "q-2",
      body: "x",
      authorName: "Stanford Student",
      authorMeta: "Dev viewer",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await addAnswer("q-2", { body: "x" });

    expect(create.mock.calls[0]?.[1]).toMatchObject({
      authorName: "Stanford Student",
      authorId: "u-test",
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

    await expect(addAnswer("q-1", { body: "x" })).rejects.toBeInstanceOf(
      HttpError,
    );
    expect(create).not.toHaveBeenCalled();
  });
});

describe("listAnswers", () => {
  it("throws HttpError(404, question_not_found) when the question is missing", async () => {
    list.mockResolvedValueOnce(null);

    await expect(listAnswers("missing")).rejects.toBeInstanceOf(HttpError);
  });

  it("maps each row to an AnswerDto", async () => {
    list.mockResolvedValueOnce([
      {
        id: "a-1",
        questionId: "q-1",
        body: "first",
        authorName: "Alice",
        authorMeta: "CS '26",
        createdAt: new Date("2026-04-01T00:00:00Z"),
        updatedAt: new Date("2026-04-01T00:00:00Z"),
        votes: [],
      },
      {
        id: "a-2",
        questionId: "q-1",
        body: "second",
        authorName: "Bob",
        authorMeta: null,
        createdAt: new Date("2026-04-02T00:00:00Z"),
        updatedAt: new Date("2026-04-02T00:00:00Z"),
        votes: [],
      },
    ]);

    const result = await listAnswers("q-1");

    expect(result.map((a) => a.id)).toEqual(["a-1", "a-2"]);
    expect(result[0]?.author).toBe("Alice");
    expect(result[1]?.authorMeta).toBe("");
  });
});
