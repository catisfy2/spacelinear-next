import { QuizResultsPage } from "@/views/quiz/QuizResultsPage";

export default async function QuizResultsRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuizResultsPage sessionId={id} />;
}
