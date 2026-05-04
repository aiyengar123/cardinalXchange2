import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json(
    { error: { code: "internal_error", message } },
    { status: 500 },
  );
}

export async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const value = (await request.json()) as unknown;
    if (isRecord(value)) {
      return value;
    }
    throw new HttpError(400, "invalid_json", "Expected a JSON object.");
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const payload: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        const existing = payload[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else if (typeof existing === "string") {
          payload[key] = [existing, value];
        } else {
          payload[key] = value;
        }
      }
    }
    return payload;
  }

  return {};
}

export function requireText(
  payload: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "missing_field", `Missing required field: ${key}.`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(
      400,
      "field_too_long",
      `${key} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmed;
}

export function optionalText(
  payload: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | undefined {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(
      400,
      "field_too_long",
      `${key} must be ${maxLength} characters or fewer.`,
    );
  }

  return trimmed;
}

export function stringList(payload: Record<string, unknown>, key: string): string[] {
  const value = payload[key];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .flatMap(splitTags)
      .slice(0, 8);
  }

  if (typeof value === "string") {
    return splitTags(value).slice(0, 8);
  }

  return [];
}

export function booleanValue(
  payload: Record<string, unknown>,
  key: string,
  defaultValue: boolean,
): boolean {
  const value = payload[key];
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }
  return defaultValue;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function splitTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
