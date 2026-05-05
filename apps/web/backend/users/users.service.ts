import {
  getUserActivityRecord,
  getUserProfileRecord,
  softDeleteUser,
  updateUserDisplayName,
  type UserActivityRecord,
  type UserProfileRecord,
} from "@cardinalxchange/db";

import { HttpError } from "@/backend/http/http";

export type UserProfileDto = {
  id: string;
  name: string;
  displayName: string;
  email: string;
  image: string | null;
  joinedAt: string;
  questionCount: number;
  answerCount: number;
  questions: Array<{
    id: string;
    slug: string;
    title: string;
    createdAt: string;
    answerCount: number;
  }>;
  answers: Array<{
    id: string;
    questionId: string;
    questionSlug: string;
    questionTitle: string;
    body: string;
    createdAt: string;
  }>;
};

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
