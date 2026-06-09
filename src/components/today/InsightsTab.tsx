"use client";

import { useMemo, useEffect, useRef } from "react";
import {
  BarChart3,
  BrainCircuit,
  BookOpen,
  Target,
  Zap,
  Flame,
  Clock,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useInsights } from "@/hooks/useQuiz";
import { cn } from "@/lib/utils";

export function InsightsTab() {
  const { user } = useAuth();
  const { topics, reviewHistory, fetchReviewHistory } = useStore();
  const { data: insights, isLoading } = useInsights();
  const fetchedRef = useRef(false);

  // Lazy-load review history when this tab mounts
  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchReviewHistory(user.id);
    }
  }, [user, fetchReviewHistory]);

  const totalReviews = reviewHistory.length;
  const topicsStudied = new Set(reviewHistory.map((r) => r.topicId)).size;

  // Quiz performance from insights API
  const quizAccuracy =
    insights?.total_quiz_questions > 0
      ? Math.round(
          (insights?.correct_quiz_answers / insights?.total_quiz_questions) *
            100,
        )
      : null;
  const totalQuizSessions = insights?.total_quiz_sessions ?? 0;
  const streakDays = insights?.streak_days ?? 0;

  // Calculate average quiz score
  const avgScore =
    insights?.avg_quiz_score != null
      ? Math.round(insights.avg_quiz_score)
      : null;

  const hasData =
    totalReviews > 0 || totalQuizSessions > 0 || topics.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <BarChart3 className="size-12 text-muted-foreground/40" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Insights</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your learning insights will appear here.
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      icon: BookOpen,
      label: "Topics Reviewed",
      value: totalReviews,
      color: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
      iconColor: "text-blue-500",
    },
    {
      icon: BrainCircuit,
      label: "Topics Studied",
      value: topicsStudied,
      color: "from-violet-500/10 to-violet-600/5 border-violet-500/20",
      iconColor: "text-violet-500",
    },
    {
      icon: Target,
      label: "Quiz Accuracy",
      value: quizAccuracy != null ? `${quizAccuracy}%` : "—",
      color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
      iconColor: "text-emerald-500",
    },
    {
      icon: Zap,
      label: "Quiz Sessions",
      value: totalQuizSessions,
      color: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
      iconColor: "text-amber-500",
    },
  ];

  // If available from insights
  const extraStats = [];
  if (avgScore != null) {
    extraStats.push({
      icon: Flame,
      label: "Avg. Score",
      value: `${avgScore}%`,
    });
  }
  if (streakDays > 0) {
    extraStats.push({
      icon: Flame,
      label: "Day Streak",
      value: streakDays,
    });
  }

  return (
    <div className="w-full max-w-lg space-y-6 py-4">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={cn(
              "flex flex-col gap-2 rounded-xl border bg-card p-4",
              card.color,
            )}
          >
            <div className="flex items-center gap-2">
              <card.icon className={cn("h-4 w-4", card.iconColor)} />
              <span className="text-xs text-muted-foreground">
                {card.label}
              </span>
            </div>
            <span className="text-2xl font-bold text-foreground">
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Extra Stats ── */}
      {extraStats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {extraStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2"
            >
              <stat.icon className="h-4 w-4 text-amber-500" />
              <div>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
                <span className="ml-2 text-sm font-semibold text-foreground">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Topics Overview ── */}
      {topics.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4" />
            Topics Overview
          </h3>
          <div className="space-y-2">
            {topics.slice(0, 8).map((topic) => {
              const topicReviews = reviewHistory.filter(
                (r) => r.topicId === topic.id,
              );
              const lastReview = topicReviews.sort(
                (a, b) =>
                  new Date(b.reviewedAt).getTime() -
                  new Date(a.reviewedAt).getTime(),
              )[0];
              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {topic.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topicReviews.length} review
                      {topicReviews.length !== 1 ? "s" : ""}
                      {lastReview &&
                        ` · ${topic.state === "reviewing" ? "Reviewing" : topic.state === "learning" ? "Learning" : topic.state === "new" ? "New" : topic.state}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {topic.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Flame className="h-3 w-3" />
                        {topic.streak}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        topic.currentDifficulty === "easy" &&
                          "text-emerald-500",
                        topic.currentDifficulty === "medium" &&
                          "text-amber-500",
                        topic.currentDifficulty === "hard" && "text-red-500",
                        topic.currentDifficulty === "relearn" &&
                          "text-destructive",
                      )}
                    >
                      {topic.currentDifficulty ?? "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
