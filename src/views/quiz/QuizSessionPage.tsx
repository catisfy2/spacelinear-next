"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { Button } from "@/components/ui/button";
import { QuizQuestionCard } from "@/components/quiz";
import { useSubmitAnswer, useCompleteSession } from "@/hooks/useQuizSession";
import { ChevronLeft, ChevronRight, Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Question, QuestionType } from "@/types/quiz";

export function QuizSessionPage({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<
    Pick<Question, "id" | "question" | "options" | "questionType" | "order">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const startTimeRef = useRef(Date.now());
  const { mutateAsync: submitAnswer } = useSubmitAnswer();
  const { mutateAsync: completeSession } = useCompleteSession();

  useEffect(() => {
    async function fetchQuestions() {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) return;

      try {
        const res = await fetch(
          `/api/quiz/sessions/${sessionId}/questions?accessToken=${encodeURIComponent(accessToken)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [sessionId]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback(
    async (answer: string) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));

      await submitAnswer({
        sessionId,
        questionId: currentQuestion.id,
        answer,
      });
    },
    [currentQuestion, sessionId, submitAnswer],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleComplete = useCallback(async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const result = await completeSession({
        sessionId,
        timeTakenSeconds: timeTaken,
      });

      router.push(`/quiz/sessions/${sessionId}/results`);
    } catch {
      setIsCompleting(false);
    }
  }, [sessionId, completeSession, router, isCompleting]);

  if (loading) {
    return (
      <PageShell maxWidth="narrow">
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!currentQuestion) {
    return (
      <PageShell maxWidth="narrow">
        <div className="flex flex-col items-center gap-4 py-12">
          <p className="text-muted-foreground">No questions found.</p>
          <Button onClick={() => router.push("/quiz/new")}>
            Generate a Quiz
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="narrow">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/quiz/new")}
          >
            <ChevronLeft className="size-4" />
            Exit
          </Button>
          <span className="text-xs text-muted-foreground">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>

        <QuizQuestionCard
          question={currentQuestion.question}
          options={currentQuestion.options}
          questionType={currentQuestion.questionType as QuestionType}
          questionIndex={currentIndex}
          totalQuestions={totalQuestions}
          selectedAnswer={answers[currentQuestion.id] ?? null}
          onAnswer={handleAnswer}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>

          {currentIndex === totalQuestions - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="gap-2"
            >
              {isCompleting ? "Submitting..." : "Submit Quiz"}
              <Flag className="size-4" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleNext}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
