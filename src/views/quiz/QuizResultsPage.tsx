"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { Button } from "@/components/ui/button";
import { QuizSummary } from "@/components/quiz";
import { useSessionDetail } from "@/hooks/useQuizSession";
import { Loader2, ChevronLeft } from "lucide-react";
import type { CompleteSessionResponse } from "@/types/quiz";

export function QuizResultsPage({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data, isLoading } = useSessionDetail(sessionId);
  const [computedResults, setComputedResults] =
    useState<CompleteSessionResponse["results"] | null>(null);

  useEffect(() => {
    if (data) {
      const results = data.answers.map((a) => ({
        questionId: a.questionId,
        question: a.question?.question ?? "",
        userAnswer: a.selectedAnswer ?? "",
        correctAnswer: a.question?.answer ?? "",
        explanation: a.question?.explanation ?? null,
        isCorrect: a.isCorrect,
        questionType: (a.question?.questionType ?? "mcq") as CompleteSessionResponse["results"][number]["questionType"],
      }));
      setComputedResults(results);
    }
  }, [data]);

  if (isLoading || !computedResults) {
    return (
      <PageShell maxWidth="narrow">
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="narrow">
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/quiz/history")}
        >
          <ChevronLeft className="size-4" />
          Back to History
        </Button>

        <QuizSummary
          results={computedResults}
          timeTakenSeconds={data?.session.timeTakenSeconds ?? null}
          totalQuestions={data?.session.totalQuestions ?? computedResults.length}
        />

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/quiz/new")}>
            New Quiz
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
