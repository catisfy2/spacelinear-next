import { QuizSessionPage } from "@/views/quiz/QuizSessionPage";

export default async function QuizSessionRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuizSessionPage sessionId={id} />;
}
