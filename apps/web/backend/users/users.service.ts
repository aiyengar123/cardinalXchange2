import {
  getUserActivityRecord,
  getUserProfileRecord,
  softDeleteUser,
  updateUserDisplayName,
  type UserActivityRecord,
  type UserProfileRecord,
} from "@cardinalxchange/db";

import type { Serialized } from "@/backend/http/contracts";
import { HttpError } from "@/backend/http/http";

/**
 * Wire shape of `/api/users/[id]`. Expressed as the serialized merge of the
 * underlying records — when a column is added to `UserProfileRecord` or
 * `UserActivityRecord`, the DTO tracks it automatically. The only divergence
 * is `joinedAt` (renamed from `createdAt`) and `displayName` (always a string
 * post-fallback, vs. nullable on the record), so those two fields are
 * spelled out alongside the derivation.
 */
export type UserProfileDto = Serialized<
  Pick<
    UserProfileRecord,
    "id" | "name" | "email" | "image" | "questionCount" | "answerCount"
  > &
    UserActivityRecord & {
      displayName: string;
      joinedAt: Date;
    }
>;

export async function getUserProfile(userId: string): Promise<UserProfileDto> {
  const [profile, activity] = await Promise.all([
    getUserProfileRecord(userId),
    getUserActivityRecord(userId),
  ]);

  if (!profile) {
    throw new HttpError(404, "user_not_found", "User not found.");
  }

  return toUserProfileDto(profile, activity);
}

export async function setUserDisplayName(
  userId: string,
  displayName: string | null,
): Promise<void> {
  const trimmed = displayName?.trim() || null;
  await updateUserDisplayName(userId, trimmed);
}

export async function deleteOwnAccount(userId: string): Promise<void> {
  await softDeleteUser(userId);
}

function toUserProfileDto(
  profile: UserProfileRecord,
  activity: UserActivityRecord,
): UserProfileDto {
  return {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName?.trim() || profile.name,
    email: profile.email,
    image: profile.image,
    joinedAt: profile.createdAt.toISOString(),
    questionCount: profile.questionCount,
    answerCount: profile.answerCount,
    questions: activity.questions.map((q) => ({
      id: q.id,
      slug: q.slug,
      title: q.title,
      createdAt: q.createdAt.toISOString(),
      answerCount: q.answerCount,
    })),
    answers: activity.answers.map((a) => ({
      id: a.id,
      questionId: a.questionId,
      questionSlug: a.questionSlug,
      questionTitle: a.questionTitle,
      body: a.body,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
