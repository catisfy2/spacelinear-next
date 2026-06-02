"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { useStartMockTest, useSubmitAnswer, useCompleteSession, useSessionDetail } from "@/hooks/useQuiz";
import { PageShell } from "@/components/app/PageShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuizPersistence } from "@/hooks/useQuizPersistence";
import { Loader2, Timer, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/types/quiz";
import type { Question } from "@/types/quiz";

type Phase = "config" | "active" | "results";

export function MockTestPage() {
  const { subjects, topics } = useStore();
  const startTest = useStartMockTest();
  const submitAnswer = useSubmitAnswer();
  const completeSession = useCompleteSession();

  const [phase, setPhase] = useState<Phase>("config");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Pick<Question, "id" | "question" | "options" | "difficulty" | "tags">[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  // Config state
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("mixed");

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timeLimitRef = useRef(0);

  // Results
  const { data: sessionDetail } = useSessionDetail(phase === "results" ? sessionId : null);

  const filteredTopics = selectedSubject && selectedSubject !== "all"
    ? topics.filter((t) => t.subjectId === selectedSubject)
    : topics;

  const currentQuestion = questions[currentIndex];

  const persistedState = phase === "active" && sessionId
    ? { sessionId, questions, currentIndex, answeredCount, timeLimitMinutes: timeLimitRef.current, timeRemaining }
    : null;

  const { loadSaved, clearSaved } = useQuizPersistence(
    "mt-quiz",
    "mock-test",
    phase,
    sessionId,
    persistedState,
    useCallback(() => {
      setPhase("config");
      setSessionId(null);
    }, []),
  );

  // Restore saved session on mount (survives page reload)
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      setSessionId(saved.sessionId);
      setQuestions(saved.questions as any);
      setCurrentIndex(saved.currentIndex);
      setAnsweredCount(saved.answeredCount);
      timeLimitRef.current = saved.timeLimitMinutes;
      setTimeRemaining(saved.timeRemaining);
      setPhase("active");
    }
  }, [loadSaved]);

  // Timer countdown
  useEffect(() => {
    if (phase !== "active" || timeLimitRef.current <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Clear saved state when transitioning to results
  useEffect(() => {
    if (phase === "results") clearSaved();
  }, [phase, clearSaved]);

  const finishSession = useCallback(async () => {
    if (!sessionId) return;
    const totalTime = timeLimitRef.current > 0 ? timeLimitRef.current * 60 - timeRemaining : undefined;
    await completeSession.mutateAsync({ sessionId, timeTakenSeconds: totalTime });
    setPhase("results");
  }, [sessionId, timeRemaining, completeSession]);

  // Auto-end when timer hits 0
  useEffect(() => {
    if (phase !== "active" || timeLimitRef.current <= 0 || timeRemaining > 0) return;
    finishSession();
  }, [timeRemaining, finishSession]);

  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setStartError(null);
    try {
      const result = await startTest.mutateAsync({
        subjectId: selectedSubject && selectedSubject !== "all" ? selectedSubject : undefined,
        topicId: selectedTopic && selectedTopic !== "all" ? selectedTopic : undefined,
        count: questionCount,
        timeLimitMinutes,
        difficulty: selectedDifficulty,
      });
      setSessionId(result.session.id);
      setQuestions(result.questions);
      setCurrentIndex(0);
      setAnsweredCount(0);
      setSelectedAnswer(null);
      timeLimitRef.current = result.timeLimitMinutes;
      setTimeRemaining(result.timeLimitMinutes * 60);
      setPhase("active");
    } catch (err: any) {
      setStartError(err.message ?? "No questions available for the selected criteria.");
    }
  }, [selectedSubject, selectedTopic, questionCount, timeLimitMinutes, selectedDifficulty, startTest]);

  const handleSelectOption = useCallback((answer: string) => {
    if (phase !== "active" || submitAnswer.isPending) return;
    setSelectedAnswer(answer);
  }, [phase, submitAnswer.isPending]);

  const handleConfirm = useCallback(async () => {
    if (!sessionId || !currentQuestion || !selectedAnswer || phase !== "active") return;
    await submitAnswer.mutateAsync({
      sessionId,
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
  }, [sessionId, currentQuestion, selectedAnswer, phase, currentIndex, questions.length, submitAnswer, finishSession]);

  // ─── Render ─────────────────────────────────────────────────────────

  if (phase === "results") {
    const answers = sessionDetail?.answers ?? [];
    const total = answers.length;
    const correct = answers.filter((a) => a.isCorrect).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <PageShell maxWidth="narrow">
        <div className="py-8">
          <Card className="mb-6 p-6 text-center">
            <h2 className="text-2xl font-semibold">Mock Test Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You answered {correct} of {total} correctly ({pct}%)
            </p>
            <Progress value={pct} className="mt-4 h-3" />
            {sessionDetail?.session?.timeTakenSeconds && (
              <p className="mt-2 text-xs text-muted-foreground">
                Time: {formatTime(sessionDetail.session.timeTakenSeconds)}
              </p>
            )}
            <Button className="mt-6" onClick={() => setPhase("config")}>
              Back to Configuration
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

  if (phase === "config") {
    return (
      <PageShell maxWidth="narrow">
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Mock Test</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a timed practice test with your chosen parameters.
          </p>

          <Card className="mt-6 p-6 space-y-6">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  {filteredTopics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Limit (minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            {startError && (
              <p className="text-sm text-red-500">{startError}</p>
            )}
            <Button
              onClick={handleStart}
              disabled={startTest.isPending}
              className="w-full"
              size="lg"
            >
              {startTest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Mock Test
            </Button>
          </Card>
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
            {timeLimitRef.current > 0 && (
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
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
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
