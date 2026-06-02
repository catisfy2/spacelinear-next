"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStartQuickPractice, useSubmitAnswer, useCompleteSession, useSessionDetail } from "@/hooks/useQuiz";
import { PageShell } from "@/components/app/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/app/EmptyState";
import { useQuizPersistence } from "@/hooks/useQuizPersistence";
import { Loader2, BrainCircuit, CheckCircle2, XCircle, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/types/quiz";
import type { Question } from "@/types/quiz";

type Phase = "idle" | "active" | "results";

export function QuickPracticePage() {
  const startPractice = useStartQuickPractice();
  const submitAnswer = useSubmitAnswer();
  const completeSession = useCompleteSession();

  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Pick<Question, "id" | "question" | "options" | "difficulty" | "tags">[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Config state
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const sessionIdRef = useRef<string | null>(null);

  // Results
  const { data: sessionDetail } = useSessionDetail(phase === "results" ? sessionId : null);

  const currentQuestion = questions[currentIndex];
  const activeElapsed = timeLimitMinutes > 0 ? timeLimitMinutes * 60 - timeRemaining : 0;

  const persistedState = phase === "active" && sessionId
    ? { sessionId, questions, currentIndex, answeredCount, timeLimitMinutes, timeRemaining }
    : null;

  const { loadSaved, clearSaved } = useQuizPersistence(
    "qp-quiz",
    "quick-practice",
    phase,
    sessionId,
    persistedState,
    useCallback(() => {
      sessionIdRef.current = null;
    }, []),
  );

  // Restore saved session on mount (survives page reload)
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setSessionId(saved.sessionId);
      sessionIdRef.current = saved.sessionId;
      setQuestions(saved.questions as any);
      setCurrentIndex(saved.currentIndex);
      setAnsweredCount(saved.answeredCount);
      setTimeLimitMinutes(saved.timeLimitMinutes);
      setTimeRemaining(saved.timeRemaining);
      setPhase("active");
    }
  }, [loadSaved]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "active" || timeLimitMinutes <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, timeLimitMinutes]);

  // Auto-end when timer hits 0
  useEffect(() => {
    if (phase !== "active" || timeLimitMinutes <= 0 || timeRemaining > 0) return;
    finishSession();
  }, [timeRemaining]);

  const finishSession = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const totalTime = timeLimitMinutes > 0 ? timeLimitMinutes * 60 - timeRemaining : Math.round((Date.now() - Date.now()) / 1000);
    await completeSession.mutateAsync({ sessionId: sid, timeTakenSeconds: activeElapsed || undefined });
    setSessionId(sid);
    setPhase("results");
  }, [timeLimitMinutes, timeRemaining, activeElapsed, completeSession]);

  const handleStart = useCallback(async () => {
    const result = await startPractice.mutateAsync(questionCount);
    sessionIdRef.current = result.session.id;
    setSessionId(result.session.id);
    setQuestions(result.questions);
    setCurrentIndex(0);
    setAnsweredCount(0);
    setSelectedAnswer(null);
    setPhase("active");
    if (timeLimitMinutes > 0) {
      setTimeRemaining(timeLimitMinutes * 60);
    }
  }, [startPractice, questionCount, timeLimitMinutes]);

  const handleSelectOption = useCallback((answer: string) => {
    if (phase !== "active" || submitAnswer.isPending) return;
    setSelectedAnswer(answer === selectedAnswer ? null : answer);
  }, [phase, selectedAnswer, submitAnswer.isPending]);

  const handleConfirm = useCallback(async () => {
    if (!sessionIdRef.current || !currentQuestion || !selectedAnswer || phase !== "active") return;
    await submitAnswer.mutateAsync({
      sessionId: sessionIdRef.current,
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      timeTakenSeconds: 0,
    });

    setAnsweredCount((prev) => prev + 1);

    if (currentIndex + 1 >= questions.length) {
      await finishSession();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  }, [currentQuestion, selectedAnswer, phase, currentIndex, questions.length, submitAnswer, finishSession]);

  const handleReset = useCallback(() => {
    clearSaved();
    setPhase("idle");
    setSessionId(null);
    sessionIdRef.current = null;
    setQuestions([]);
    setCurrentIndex(0);
  }, [clearSaved]);

  if (startPractice.isPending) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  if (phase === "results") {
    clearSaved();
    const answers = sessionDetail?.answers ?? [];
    const sess = sessionDetail?.session;
    const total = answers.length;
    const correct = answers.filter((a) => a.isCorrect).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <PageShell maxWidth="narrow">
        <div className="py-8">
          <Card className="mb-6 p-6 text-center">
            <h2 className="text-2xl font-semibold">Session Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You answered {correct} of {total} correctly ({pct}%)
            </p>
            <Progress value={pct} className="mt-4 h-3" />
            {sess?.timeTakenSeconds && (
              <p className="mt-2 text-xs text-muted-foreground">
                Time: {formatTime(sess.timeTakenSeconds)}
              </p>
            )}
            <Button className="mt-6" onClick={handleReset}>
              Back to Start
            </Button>
          </Card>

          <div className="space-y-3">
            {answers.map((answer, idx) => (
              <Card key={answer.id} className="p-4">
                <div className="flex items-start gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {idx + 1}. {answer.question?.question ?? "Question"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your answer: {answer.selectedAnswer}
                    </p>
                    {!answer.isCorrect && (
                      <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        Correct: {answer.question?.answer}
                      </p>
                    )}
                    {answer.question?.explanation && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {answer.question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  if (phase === "idle") {
    return (
      <PageShell maxWidth="narrow">
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Quick Practice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Random questions to keep your knowledge sharp.
          </p>
          <div className="mt-6 space-y-4 max-w-xs">
            <div className="space-y-2">
              <Label htmlFor="qp-count">Number of questions</Label>
              <Input
                id="qp-count"
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value) || 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qp-time">Time limit (minutes, 0 = no limit)</Label>
              <Input
                id="qp-time"
                type="number"
                min={0}
                max={120}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value) || 0)}
              />
            </div>
            <Button onClick={handleStart} size="lg" className="mt-4">
              <BrainCircuit className="mr-2 h-4 w-4" />
              Start Practice
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!currentQuestion) return null;

  return (
    <PageShell maxWidth="narrow">
      <div className="py-8">
        <p className="mb-4 text-xs text-muted-foreground">
          If you leave this page, the quiz will be dismissed.
        </p>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-3">
            {timeLimitMinutes > 0 && (
              <span className={cn(
                "flex items-center gap-1 text-sm font-mono",
                timeRemaining <= 60 && "text-red-500",
              )}>
                <Timer className="h-3.5 w-3.5" />
                {formatTime(timeRemaining)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{questions.length}
            </span>
          </div>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} className="mb-6 h-2" />

        <div className="mb-2 flex gap-2">
          <Badge variant="outline">{currentQuestion.difficulty}</Badge>
          {currentQuestion.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <h2 className="mb-6 text-lg font-medium">{currentQuestion.question}</h2>

        <div className="grid gap-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={phase !== "active" || submitAnswer.isPending}
              onClick={() => handleSelectOption(option)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                "hover:border-primary hover:bg-primary/5",
                selectedAnswer === option && "border-primary bg-primary/5",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {selectedAnswer && phase === "active" && (
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={handleConfirm}
            disabled={submitAnswer.isPending}
          >
            {submitAnswer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm &amp; Continue
          </Button>
        )}
      </div>
    </PageShell>
  );
}
