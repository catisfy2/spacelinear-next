"use client";

import { CheckCircle2, XCircle, Clock, Target } from "lucide-react";
import { calculateScore, formatTime, getAccuracyLabel, getAccuracyColor } from "@/types/quiz";
import type { CompleteSessionResponse } from "@/types/quiz";

export function QuizSummary({
  results,
  timeTakenSeconds,
  totalQuestions,
}: {
  results: CompleteSessionResponse["results"];
  timeTakenSeconds: number | null;
  totalQuestions: number;
}) {
  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = calculateScore(correctCount, totalQuestions);
  const accuracyLabel = getAccuracyLabel(score);
  const accuracyColor = getAccuracyColor(score);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 py-6">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-bold text-foreground">{score}%</span>
        </div>
        <span className={`text-sm font-medium ${accuracyColor}`}>
          {accuracyLabel}
        </span>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-4 text-emerald-500" />
            {correctCount} correct
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="size-4 text-red-500" />
            {totalQuestions - correctCount} incorrect
          </span>
          {timeTakenSeconds && (
            <span className="flex items-center gap-1">
              <Clock className="size-4" />
              {formatTime(timeTakenSeconds)}
            </span>
          )}
        </div>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 75
              ? "bg-emerald-500"
              : score >= 60
                ? "bg-amber-500"
                : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Correct</p>
          <p className="text-2xl font-bold text-emerald-500">{correctCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Incorrect</p>
          <p className="text-2xl font-bold text-red-500">
            {totalQuestions - correctCount}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Question Review</h3>
        {results.map((r, i) => (
          <div
            key={r.questionId}
            className={`rounded-lg border p-4 ${
              r.isCorrect
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-red-500/30 bg-red-500/5"
            }`}
          >
            <div className="mb-2 flex items-start gap-2">
              {r.isCorrect ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
              )}
              <div>
                <p className="text-sm text-foreground">
                  {i + 1}. {r.question}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your answer:{" "}
                  <span
                    className={
                      r.isCorrect ? "text-emerald-500" : "text-red-500"
                    }
                  >
                    {r.userAnswer || "(skipped)"}
                  </span>
                </p>
                {!r.isCorrect && (
                  <p className="text-xs text-muted-foreground">
                    Correct answer:{" "}
                    <span className="text-emerald-500">{r.correctAnswer}</span>
                  </p>
                )}
                {r.explanation && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
