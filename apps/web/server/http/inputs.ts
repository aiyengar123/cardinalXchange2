import { z } from "zod";

import type {
  CreateAnswerInput,
  CreateQuestionInput,
} from "@/server/http/contracts";
import { HttpError, optionalText, stringList } from "@/server/http/http";

const TAG_RE = /^[\p{L}\p{N}][\p{L}\p{N}\s_+./#-]*$/u;

export const createQuestionInput = z.object({
  title: z.string().trim().min(1, "Title is required.").max(180),
  body: z.string().trim().min(1, "Body is required.").max(5000),
  tags: z
    .array(z.string().trim().min(1).max(64).regex(TAG_RE))
    .max(8)
    .default([]),
  authorDisplayName: z.string().trim().min(1).max(80).optional(),
  authorMeta: z.string().trim().min(1).max(120).optional(),
});

export const createAnswerInput = z.object({
  body: z.string().trim().min(1, "Answer body is required.").max(5000),
  authorDisplayName: z.string().trim().min(1).max(80).optional(),
  authorMeta: z.string().trim().min(1).max(120).optional(),
});

const uiMessagePartSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

const uiMessageSchema = z
  .object({
    id: z.string().min(1).max(120),
    role: z.union([
      z.literal("user"),
      z.literal("assistant"),
      z.literal("system"),
    ]),
    parts: z.array(uiMessagePartSchema),
  })
  .passthrough();

export const cxcChatInput = z.object({
  id: z.string().trim().min(1).max(120),
  messages: z.array(uiMessageSchema).min(1, "At least one message is required."),
});

export type CreateQuestionInputParsed = z.infer<typeof createQuestionInput>;
export type CreateAnswerInputParsed = z.infer<typeof createAnswerInput>;
export type CxcChatInputParsed = z.infer<typeof cxcChatInput>;

/**
 * Lightweight wrappers that translate zod parse errors into `HttpError`
 * 400s with stable codes. Route handlers stay tiny — call `parse*` and let
 * the handler-level catch route the error to `jsonError`.
 */

export function parseCreateQuestionInput(
  payload: Record<string, unknown>,
): CreateQuestionInput {
  const normalized: Record<string, unknown> = {
    ...payload,
    tags: normalizeIncomingTags(payload),
  };

  const result = createQuestionInput.safeParse(normalized);
  if (!result.success) {
    throw zodToHttpError(result.error, "invalid_question_input");
  }

  return {
    title: result.data.title,
    body: result.data.body,
    tags: result.data.tags,
    authorDisplayName: result.data.authorDisplayName,
    authorMeta: result.data.authorMeta,
  };
}

export function parseCreateAnswerInput(
  payload: Record<string, unknown>,
): CreateAnswerInput {
  const result = createAnswerInput.safeParse(payload);
  if (!result.success) {
    throw zodToHttpError(result.error, "invalid_answer_input");
  }

  return {
    body: result.data.body,
    authorDisplayName: result.data.authorDisplayName,
    authorMeta: result.data.authorMeta,
  };
}

export function parseCxcChatInput(
  payload: Record<string, unknown>,
): CxcChatInputParsed {
  const result = cxcChatInput.safeParse(payload);
  if (!result.success) {
    throw zodToHttpError(result.error, "invalid_chat_input");
  }
  return result.data;
}

export function parseSearchInput(searchParams: URLSearchParams): {
  query: string;
  tag?: string;
} {
  const query = optionalText(
    { query: searchParams.get("query") ?? searchParams.get("q") ?? "" },
    "query",
    240,
  );
  const tag = optionalText({ tag: searchParams.get("tag") ?? "" }, "tag", 64);

  if (!query && !tag) {
    throw new HttpError(
      400,
      "missing_search_query",
      "Provide ?query= or ?tag= to search.",
    );
  }

  return { query: query ?? "", tag };
}

function normalizeIncomingTags(payload: Record<string, unknown>): string[] {
  // Form posts arrive as comma-separated strings; JSON payloads send arrays.
  // `stringList` handles both shapes consistently and caps at 8.
  if (Array.isArray(payload.tags)) {
    return stringList(payload, "tags");
  }
  if (typeof payload.tags === "string") {
    return stringList(payload, "tags");
  }
  return [];
}

function zodToHttpError(error: z.ZodError, code: string): HttpError {
  const first = error.issues[0];
  const path = first?.path?.join(".") ?? "";
  const message = first
    ? path
      ? `${path}: ${first.message}`
      : first.message
    : "Invalid input.";

  return new HttpError(400, code, message);
}

// Back-compat name used by tests / older imports while we migrate.
export const createCxcChatInput = cxcChatInput;
