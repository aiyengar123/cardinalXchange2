import { jsonError, jsonOk, readPayload } from "@/backend/http/http";
import { HttpError } from "@/backend/http/http";
import { voteAnswer } from "@/backend/answers/answers.service";

type RouteContext = {
  params: Promise<{ questionId: string; answerId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { answerId } = await context.params;
    const payload = await readPayload(request);
    const raw = payload.value;
    if (raw !== 1 && raw !== -1 && raw !== 0) {
      throw new HttpError(
        400,
        "invalid_vote_value",
        "value must be 1, -1, or 0.",
      );
    }
    await voteAnswer(answerId, raw as 1 | -1 | 0);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
