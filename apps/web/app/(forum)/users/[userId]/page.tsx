import Link from "next/link";
import { notFound } from "next/navigation";

import { getUserProfile } from "@/backend/users";
import { HttpError } from "@/backend/http/http";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserProfilePage({ params }: PageProps) {
  const { userId } = await params;

  let profile;
  try {
    profile = await getUserProfile(userId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const initial = (profile.displayName || profile.name)
    .slice(0, 1)
    .toUpperCase();
  const joined = new Date(profile.joinedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-8 py-6">
      <header className="flex items-start gap-4 rounded-2xl border border-[var(--color-border-default)] bg-white p-6">
        <div
          aria-hidden
          className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-cardinal-500)] text-2xl font-semibold text-white"
        >
          {profile.image ? (
            <img
              alt=""
              className="h-full w-full object-cover"
              src={profile.image}
            />
          ) : (
            initial
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink-900)]">
            {profile.displayName}
          </h1>
          <p className="text-sm text-[var(--color-ink-500)]">
            Joined {joined} · Asked {profile.questionCount} questions, answered{" "}
            {profile.answerCount} times
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          Questions
        </h2>
        {profile.questions.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-500)]">
            No questions yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profile.questions.map((question) => (
              <li
                className="rounded-xl border border-[var(--color-border-default)] bg-white p-4"
                key={question.id}
              >
                <Link
                  className="block text-sm font-medium text-[var(--color-ink-900)] hover:text-[var(--color-cardinal-500)]"
                  href={`/questions/${question.slug}`}
                >
                  {question.title}
                </Link>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {question.answerCount} answers ·{" "}
                  {new Date(question.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
          Answers
        </h2>
        {profile.answers.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-500)]">No answers yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profile.answers.map((answer) => (
              <li
                className="rounded-xl border border-[var(--color-border-default)] bg-white p-4"
                key={answer.id}
              >
                <Link
                  className="block text-sm font-medium text-[var(--color-ink-900)] hover:text-[var(--color-cardinal-500)]"
                  href={`/questions/${answer.questionSlug}#answer-${answer.id}`}
                >
                  {answer.questionTitle}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink-700)]">
                  {answer.body}
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {new Date(answer.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
