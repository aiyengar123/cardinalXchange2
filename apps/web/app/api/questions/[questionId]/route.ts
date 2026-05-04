import { jsonError, jsonOk } from "@/backend/http/http";
import { getQuestionDetail } from "@/backend/questions/questions.service";

type RouteContext = {
  params: Promise<{ questionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { questionId } = await context.params;
    return jsonOk({ question: await getQuestionDetail(questionId) });
  } catch (error) {
    return jsonError(error);
  }
}
