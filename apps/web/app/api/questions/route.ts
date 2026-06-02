import { jsonError, jsonOk, readPayload } from "@/backend/http/http";
import { parseCreateQuestionInput } from "@/backend/http/inputs";
import {
  createQuestion,
  listQuestionsForFeed,
} from "@/backend/questions/questions.service";
import type { FeedSort } from "@/backend/questions/questions.types";

const ALLOWED_SORTS: ReadonlySet<FeedSort> = new Set([
  "newest",
  "active",
  "unanswered",
  "answered",
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortParam = searchParams.get("sort") as FeedSort | null;
    const sort: FeedSort | undefined =
      sortParam && ALLOWED_SORTS.has(sortParam) ? sortParam : undefined;
    const tag = searchParams.get("tag")?.trim() || undefined;

    const questions = await listQuestionsForFeed({ tag, sort });
    return jsonOk({ questions });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readPayload(request);
    const question = await createQuestion(parseCreateQuestionInput(payload));
    return jsonOk({ question }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
