import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AnswerComposer,
  AnswerList,
  QuestionDetail,
} from "@/features/questions";
import { HttpError } from "@/server/http/http";
import { getQuestionDetail } from "@/server/questions/questions.service";

type QuestionDetailPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function QuestionDetailPage({
  params,
}: QuestionDetailPageProps) {
  const { questionId } = await params;

  let question;
  try {
    question = await getQuestionDetail(questionId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          className="text-sm font-medium text-[var(--color-cardinal-500)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
          href="/questions"
        >
          ← Back to questions
        </Link>
      </div>

      <QuestionDetail question={question} />

      <div className="mt-6">
        <AnswerList answers={question.answersList} />
      </div>

      <div className="mt-6">
        <AnswerComposer questionId={question.slug} />
      </div>
    </div>
  );
}
