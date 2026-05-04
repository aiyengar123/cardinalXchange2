import {
  searchInternalContext as searchInternalContextRecord,
  searchQuestionRecords,
  type InternalContextRow,
  type QuestionRecord,
} from "@cardinalxchange/db";

export type FindMatchingQuestionsArgs = {
  query: string;
  tag?: string;
  limit?: number;
};

export async function findMatchingQuestions(
  args: FindMatchingQuestionsArgs,
): Promise<QuestionRecord[]> {
  return searchQuestionRecords({
    query: args.query,
    tags: args.tag ? [args.tag] : [],
    limit: args.limit,
  });
}

export async function findInternalContext(
  query: string,
  options: { limit?: number; tags?: string[] } = {},
): Promise<InternalContextRow[]> {
  return searchInternalContextRecord(query, options);
}
