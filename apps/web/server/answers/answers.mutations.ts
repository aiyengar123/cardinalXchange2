import {
  createAnswerRecord,
  type CreateAnswerRecordInput,
} from "@cardinalxchange/db";

export async function persistAnswer(
  questionIdOrSlug: string,
  input: CreateAnswerRecordInput,
) {
  return createAnswerRecord(questionIdOrSlug, input);
}
