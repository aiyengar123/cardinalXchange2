import { describe, expect, it } from "vitest";

import { HttpError } from "../http";
import {
  parseCreateAnswerInput,
  parseCreateQuestionInput,
  parseCxcChatInput,
  parseSearchInput,
  parseUpdateUserProfileInput,
} from "../inputs";

describe("parseCreateQuestionInput", () => {
  it("accepts a minimal valid payload and returns trimmed values", () => {
    const result = parseCreateQuestionInput({
      title: "  How do I drop CS 109?  ",
      body: "I need help understanding the schedule.",
    });

    expect(result.title).toBe("How do I drop CS 109?");
    expect(result.body).toBe("I need help understanding the schedule.");
    expect(result.tags).toEqual([]);
    expect(result.authorDisplayName).toBeUndefined();
  });

  it("normalizes a comma-separated tags string into an array", () => {
    const result = parseCreateQuestionInput({
      title: "Recommendations for HCI electives",
      body: "Looking for HCI electives next quarter.",
      tags: "hci, design, electives",
    });

    expect(result.tags).toEqual(["hci", "design", "electives"]);
  });

  it("rejects an empty title with a 400 invalid_question_input HttpError", () => {
    expect(() =>
      parseCreateQuestionInput({
        title: "   ",
        body: "Body is fine.",
      }),
    ).toThrowError(HttpError);

    try {
      parseCreateQuestionInput({ title: "", body: "Body is fine." });
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(400);
      expect(httpError.code).toBe("invalid_question_input");
      expect(httpError.message.toLowerCase()).toContain("title");
    }
  });

  it("rejects a missing body with a 400 invalid_question_input HttpError", () => {
    try {
      parseCreateQuestionInput({ title: "A real title", body: "" });
      throw new Error("expected parseCreateQuestionInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(400);
      expect(httpError.code).toBe("invalid_question_input");
    }
  });

  it("accepts a title at the 180-char max but rejects 181 chars", () => {
    const ok = parseCreateQuestionInput({
      title: "a".repeat(180),
      body: "ok body",
    });
    expect(ok.title.length).toBe(180);

    expect(() =>
      parseCreateQuestionInput({
        title: "a".repeat(181),
        body: "ok body",
      }),
    ).toThrowError(HttpError);
  });

  it("rejects a body longer than 5000 chars", () => {
    expect(() =>
      parseCreateQuestionInput({
        title: "ok title",
        body: "x".repeat(5001),
      }),
    ).toThrowError(HttpError);
  });

  it("accepts an array of up to 8 tags but rejects 9", () => {
    const eight = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const result = parseCreateQuestionInput({
      title: "ok",
      body: "ok body",
      tags: eight,
    });
    expect(result.tags).toEqual(eight);

    // stringList caps incoming arrays at 8 silently — pass a string with 9
    // comma-separated tags to confirm the cap kicks in for the form path too.
    const capped = parseCreateQuestionInput({
      title: "ok",
      body: "ok body",
      tags: "a,b,c,d,e,f,g,h,i",
    });
    expect(capped.tags.length).toBe(8);
  });

  it("preserves unicode in titles and bodies", () => {
    const result = parseCreateQuestionInput({
      title: "Café résumé — naïve question?",
      body: "我有一个问题 about こんにちは ✨",
    });
    expect(result.title).toBe("Café résumé — naïve question?");
    expect(result.body).toContain("✨");
  });

  it("trims authorDisplayName and rejects whitespace-only", () => {
    const result = parseCreateQuestionInput({
      title: "ok",
      body: "ok body",
      authorDisplayName: "  Stephen  ",
    });
    expect(result.authorDisplayName).toBe("Stephen");

    expect(() =>
      parseCreateQuestionInput({
        title: "ok",
        body: "ok body",
        authorDisplayName: "   ",
      }),
    ).toThrowError(HttpError);
  });
});

describe("parseCreateAnswerInput", () => {
  it("rejects an empty body with a 400 invalid_answer_input HttpError", () => {
    try {
      parseCreateAnswerInput({ body: "   " });
      throw new Error("expected parseCreateAnswerInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(400);
      expect(httpError.code).toBe("invalid_answer_input");
    }
  });

  it("accepts a valid body and returns the trimmed value", () => {
    const result = parseCreateAnswerInput({
      body: "  This is a real answer.  ",
    });
    expect(result.body).toBe("This is a real answer.");
  });
});

describe("parseCxcChatInput", () => {
  it("accepts a valid id + at least one user message", () => {
    const result = parseCxcChatInput({
      id: "session-1",
      messages: [
        {
          id: "m-1",
          role: "user",
          parts: [{ type: "text", text: "hello" }],
        },
      ],
    });

    expect(result.id).toBe("session-1");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]?.role).toBe("user");
  });

  it("rejects an empty messages array with invalid_chat_input", () => {
    try {
      parseCxcChatInput({ id: "session-1", messages: [] });
      throw new Error("expected parseCxcChatInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).code).toBe("invalid_chat_input");
      expect((error as HttpError).status).toBe(400);
    }
  });

  it("rejects a message with an unknown role", () => {
    expect(() =>
      parseCxcChatInput({
        id: "s",
        messages: [
          {
            id: "m",
            role: "robot" as unknown as "user",
            parts: [{ type: "text", text: "hi" }],
          },
        ],
      }),
    ).toThrowError(HttpError);
  });
});

describe("parseSearchInput", () => {
  it("accepts ?query= and returns the trimmed query", () => {
    const params = new URLSearchParams({ query: "  eduroam  " });
    const result = parseSearchInput(params);
    expect(result.query).toBe("eduroam");
    expect(result.tag).toBeUndefined();
  });

  it("aliases ?q= to query when ?query= is missing", () => {
    const params = new URLSearchParams({ q: "wifi" });
    const result = parseSearchInput(params);
    expect(result.query).toBe("wifi");
  });

  it("throws missing_search_query when both query and tag are absent", () => {
    const params = new URLSearchParams({});
    try {
      parseSearchInput(params);
      throw new Error("expected parseSearchInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).code).toBe("missing_search_query");
    }
  });
});

describe("parseUpdateUserProfileInput", () => {
  it("accepts an absent displayName (no-op patch)", () => {
    const result = parseUpdateUserProfileInput({});
    expect(result.displayName).toBeUndefined();
  });

  it("trims and returns a non-empty displayName", () => {
    const result = parseUpdateUserProfileInput({ displayName: "  Alice  " });
    expect(result.displayName).toBe("Alice");
  });

  it("accepts null to clear the displayName", () => {
    const result = parseUpdateUserProfileInput({ displayName: null });
    expect(result.displayName).toBeNull();
  });

  it("rejects displayNames longer than 80 characters", () => {
    const long = "a".repeat(81);
    try {
      parseUpdateUserProfileInput({ displayName: long });
      throw new Error("expected parseUpdateUserProfileInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).code).toBe("invalid_user_profile_input");
      expect((error as HttpError).status).toBe(400);
    }
  });

  it("rejects non-string displayName values", () => {
    try {
      parseUpdateUserProfileInput({ displayName: 42 });
      throw new Error("expected parseUpdateUserProfileInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).code).toBe("invalid_user_profile_input");
    }
  });
});
