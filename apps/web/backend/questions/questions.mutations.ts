import {
  createQuestionRecord,
  type CreateQuestionRecordInput,
  type QuestionRecord,
} from "@cardinalxchange/db";

/**
 * Thin write wrappers. Keeping these in their own file matches the
 * queries/mutations split used by the db package and makes the service
 * layer readable.
 */

export async function persistQuestion(
  input: CreateQuestionRecordInput,
): Promise<QuestionRecord> {
  return createQuestionRecord(input);
}
