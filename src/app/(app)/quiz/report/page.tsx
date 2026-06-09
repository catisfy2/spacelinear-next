import { QuizReportPage } from "@/views/quiz/QuizReportPage";

export default async function QuizReportRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;
  return <QuizReportPage initialSessionId={sessionId} />;
}
