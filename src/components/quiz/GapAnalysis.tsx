"use client";

import { useGapAnalysis } from "@/hooks/useQuizReports";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export function GapAnalysis() {
  const { data, isLoading, error } = useGapAnalysis();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data || data.gaps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        Complete some quizzes to see your gap analysis.
      </div>
    );
  }

  const weakTopics = data.gaps.filter((g) => g.accuracy < 60);
  const strongTopics = data.gaps.filter((g) => g.accuracy >= 60);

  return (
    <div className="space-y-4">
      {weakTopics.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-sm font-medium text-amber-500">
            <AlertTriangle className="size-4" />
            Needs Improvement
          </p>
          <div className="space-y-1">
            {weakTopics.map((gap) => (
              <div
                key={gap.topicName}
                className="flex items-center justify-between rounded-lg bg-amber-500/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-foreground">{gap.topicName}</p>
                  <p className="text-xs text-muted-foreground">
                    {gap.subjectName ?? "General"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-500">
                    {gap.accuracy}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gap.correctCount}/{gap.totalAttempts}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {strongTopics.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-sm font-medium text-emerald-500">
            <CheckCircle2 className="size-4" />
            Strong Areas
          </p>
          <div className="space-y-1">
            {strongTopics.map((gap) => (
              <div
                key={gap.topicName}
                className="flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-foreground">{gap.topicName}</p>
                  <p className="text-xs text-muted-foreground">
                    {gap.subjectName ?? "General"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-500">
                    {gap.accuracy}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gap.correctCount}/{gap.totalAttempts}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
