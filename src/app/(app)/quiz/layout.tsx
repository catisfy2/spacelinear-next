import { QuizLayout } from "@/views/QuizLayout";

export default function QuizRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QuizLayout>{children}</QuizLayout>;
}
