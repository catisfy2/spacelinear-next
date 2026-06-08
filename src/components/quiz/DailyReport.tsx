"use client";

import { useDailyReport } from "@/hooks/useQuizReports";
import { formatTime, getAccuracyColor } from "@/types/quiz";
import { Loader2 } from "lucide-react";

export function DailyReport({ date }: { date?: string }) {
  const { data, isLoading, error } = useDailyReport(date);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data || data.quizzesTaken === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No quiz activity today.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Today</span>
        <span className={`text-sm font-medium ${getAccuracyColor(data.accuracy)}`}>
          {data.accuracy}%
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-lg font-bold text-foreground">{data.quizzesTaken}</p>
          <p className="text-xs text-muted-foreground">Quizzes</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-lg font-bold text-foreground">{data.questionsAnswered}</p>
          <p className="text-xs text-muted-foreground">Questions</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-center">
          <p className="text-lg font-bold text-foreground">{data.uniqueTopics}</p>
          <p className="text-xs text-muted-foreground">Topics</p>
        </div>
      </div>
      {data.totalTimeSeconds > 0 && (
        <p className="text-xs text-muted-foreground">
          Time spent: {formatTime(data.totalTimeSeconds)}
        </p>
      )}
    </div>
  );
}
