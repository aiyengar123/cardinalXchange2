// Internal answer types. Wire DTOs (`AnswerDto`, `CreateAnswerInput`) live in
// `@/server/http/contracts`. This file is reserved for future server-only
// shapes around answer authoring.

export type AnswerAuthorOverride = {
  authorDisplayName?: string;
  authorMeta?: string;
};
