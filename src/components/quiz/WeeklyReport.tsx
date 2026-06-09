"use client";

import { useWeeklyReport } from "@/hooks/useQuizReports";
import { getAccuracyColor, formatTime } from "@/types/quiz";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

export function WeeklyReport() {
  const { data, isLoading, error } = useWeeklyReport();

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
        No activity this week.
      </div>
    );
  }

  const firstAccuracy = data.dailyBreakdown[0]?.accuracy ?? 0;
  const lastAccuracy =
    data.dailyBreakdown[data.dailyBreakdown.length - 1]?.accuracy ?? 0;
  const trend = lastAccuracy - firstAccuracy;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">This Week</span>
          <span
            className={`ml-2 text-xs ${
              trend >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="inline size-3" />
            ) : (
              <TrendingDown className="inline size-3" />
            )}
            {Math.abs(trend)}%
          </span>
        </div>
        <span
          className={`text-sm font-medium ${getAccuracyColor(data.accuracy)}`}
        >
          {data.accuracy}% avg
        </span>
      </div>

      <div className="flex items-end gap-1" style={{ height: 48 }}>
        {data.dailyBreakdown.map((day) => {
          const height = Math.max(8, day.accuracy * 0.48);
          const barColor =
            day.accuracy >= 75
              ? "#10b981"
              : day.accuracy >= 60
                ? "#f59e0b"
                : "#ef4444";
          return (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="w-full rounded-t-sm transition-all"
                style={{ height, backgroundColor: barColor }}
              />
              <span className="text-[10px] text-muted-foreground">
                {new Date(day.date + "T00:00:00").toLocaleDateString("en", {
                  weekday: "short",
                })}
              </span>
            </div>
          );
        })}
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
          <p className="text-lg font-bold text-foreground">
            {formatTime(data.totalTimeSeconds)}
          </p>
          <p className="text-xs text-muted-foreground">Time</p>
        </div>
      </div>
    </div>
  );
}
