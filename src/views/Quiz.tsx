"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Quiz } from "@/lib/types";

export function QuizPage() {
  const { user } = useAuth();
  const { subjects, topics, quizzes, fetchQuizzes, submitQuizAnswer } =
    useStore();

  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [activeQuizzes, setActiveQuizzes] = useState<Quiz[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const subjectOptions = useMemo(() => {
    const fromSubjects = subjects.map((subject) => subject.name);
    const fromQuizzes = quizzes
      .map((quiz) => quiz.subject)
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set([...fromSubjects, ...fromQuizzes])).sort();
  }, [subjects, quizzes]);

  const topicOptions = useMemo(() => {
    const filteredTopics =
      selectedSubject === "all"
        ? topics
        : topics.filter((topic) => {
            const subject = subjects.find((item) => item.id === topic.subjectId);
            return subject?.name === selectedSubject;
          });

    const fromTopics = filteredTopics.map((topic) => topic.title);
    const fromQuizzes = quizzes
      .filter(
        (quiz) =>
          selectedSubject === "all" || quiz.subject === selectedSubject,
      )
      .map((quiz) => quiz.topic)
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set([...fromTopics, ...fromQuizzes])).sort();
  }, [topics, subjects, quizzes, selectedSubject]);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      await fetchQuizzes({
        subject: selectedSubject === "all" ? undefined : selectedSubject,
        topic: selectedTopic === "all" ? undefined : selectedTopic,
      });
    } finally {
      setLoading(false);
    }
  }, [fetchQuizzes, selectedSubject, selectedTopic]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  useEffect(() => {
    setSelectedTopic("all");
  }, [selectedSubject]);

  const currentQuiz = activeQuizzes[currentIndex];
  const sessionComplete =
    sessionStarted && activeQuizzes.length > 0 && currentIndex >= activeQuizzes.length;

  const startSession = () => {
    if (quizzes.length === 0) return;
    setActiveQuizzes([...quizzes]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionStarted(true);
    setSessionScore({ correct: 0, total: 0 });
  };

  const handleAnswer = async (answer: string) => {
    if (!user || !currentQuiz || showResult || isSubmitting) return;

    setSelectedAnswer(answer);
    setShowResult(true);
    setIsSubmitting(true);

    try {
      const isCorrect = await submitQuizAnswer(currentQuiz.id, answer, user.id);
      setSessionScore((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const resetSession = () => {
    setSessionStarted(false);
    setActiveQuizzes([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionScore({ correct: 0, total: 0 });
  };

  return (
    <PageShell>
      <PageHeader
        title="Quiz"
        description="Practice with AI-generated questions from shared study materials."
      />

      <div className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Subject
          </label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjectOptions.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Topic
          </label>
          <Select value={selectedTopic} onValueChange={setSelectedTopic}>
            <SelectTrigger>
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {topicOptions.map((topic) => (
                <SelectItem key={topic} value={topic}>
                  {topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button
            className="w-full md:w-auto"
            onClick={startSession}
            disabled={loading || quizzes.length === 0 || sessionStarted}
          >
            Start quiz ({quizzes.length})
          </Button>
        </div>
      </div>

      {!sessionStarted && !loading && quizzes.length === 0 && (
        <EmptyState
          icon="🧠"
          title="No quizzes yet"
          description="Upload study materials and AI will generate shared quiz questions for everyone."
        />
      )}

      {sessionStarted && currentQuiz && !sessionComplete && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BrainCircuit className="h-4 w-4" />
              Question {currentIndex + 1} of {activeQuizzes.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Score: {sessionScore.correct}/{sessionScore.total}
            </div>
          </div>

          <h2 className="mb-6 text-lg font-medium text-foreground">
            {currentQuiz.question}
          </h2>

          <div className="grid gap-3">
            {currentQuiz.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQuiz.answer;

              return (
                <button
                  key={option}
                  type="button"
                  disabled={showResult || isSubmitting}
                  onClick={() => void handleAnswer(option)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                    !showResult &&
                      "hover:border-primary hover:bg-primary/5",
                    showResult &&
                      isCorrectOption &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                    showResult &&
                      isSelected &&
                      !isCorrectOption &&
                      "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300",
                    !showResult && isSelected && "border-primary bg-primary/5",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                {selectedAnswer === currentQuiz.answer ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-300">
                      Correct
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-300">
                      Incorrect. Answer: {currentQuiz.answer}
                    </span>
                  </>
                )}
              </div>
              <Button onClick={handleNext}>
                {currentIndex + 1 >= activeQuizzes.length ? "Finish" : "Next"}
              </Button>
            </div>
          )}

          {currentQuiz.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentQuiz.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {sessionComplete && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6 text-center">
          <h3 className="text-lg font-medium text-foreground">Session complete</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You answered {sessionScore.correct} out of {sessionScore.total} correctly.
          </p>
          <Button className="mt-4" onClick={resetSession}>
            Back to filters
          </Button>
        </div>
      )}
    </PageShell>
  );
}
