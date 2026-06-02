import { notFound } from "next/navigation";

import {
  AnswerComposer,
  AnswerList,
  QuestionDetail,
} from "@/features/questions";
import { HttpError } from "@/backend/http/http";
import { getQuestionDetail } from "@/backend/questions/questions.service";

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
    <div className="flex flex-col gap-8 py-2">
      <QuestionDetail question={question} />
      <div className="flex">
        <AnswerComposer questionId={question.slug} />
      </div>
      <AnswerList answers={question.answersList} questionId={question.slug} />
    </div>
  );
}
