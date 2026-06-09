"use client";

import { useMemo, useEffect, useRef } from "react";
import { History, Clock, BrainCircuit, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/hooks/useQuiz";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/constants";

export function HistoryTab() {
  const { user } = useAuth();
  const { reviewHistory, topics, subjects, fetchReviewHistory } = useStore();
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions(1);
  const fetchedRef = useRef(false);

  // Lazy-load review history when this tab mounts
  useEffect(() => {
    if (user && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchReviewHistory(user.id);
    }
  }, [user, fetchReviewHistory]);

  // Derive subject lookup map
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const topic of topics) {
      const subject = subjects.find((s) => s.id === topic.subjectId);
      if (subject) map.set(topic.id, subject.name);
    }
    return map;
  }, [topics, subjects]);

  // Recent topic reviews (last 10)
  const recentReviews = useMemo(() => {
    return [...reviewHistory]
      .sort(
        (a, b) =>
          new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
      )
      .slice(0, 10);
  }, [reviewHistory]);

  const sessions = sessionsData?.sessions ?? [];
  const hasAnyHistory = sessions.length > 0 || reviewHistory.length > 0;

  if (!hasAnyHistory) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <History className="size-12 text-muted-foreground/40" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your study history will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6 py-4">
      {/* ── Quiz Sessions ── */}
      {sessions.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BrainCircuit className="h-4 w-4" />
            Recent Quiz Sessions
          </h3>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => {
              const total = session.totalQuestions;
              const correct = session.score;
              const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        pct >= 80
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : pct >= 50
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400",
                      )}
                    >
                      {pct}%
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {session.mode === "quick_practice"
                          ? "Quick Practice"
                          : session.mode === "mock_test"
                            ? "Mock Test"
                            : "Quiz Session"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {correct}/{total} correct
                        {session.timeTakenSeconds != null &&
                          ` · ${Math.floor(session.timeTakenSeconds / 60)}m ${session.timeTakenSeconds % 60}s`}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(session.startedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Topic Reviews ── */}
      {recentReviews.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4" />
            Recent Topic Reviews
          </h3>
          <div className="space-y-2">
            {recentReviews.map((review) => {
              const topic = topics.find((t) => t.id === review.topicId);
              const subjectName = topic ? subjectMap.get(topic.id) : undefined;
              return (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {topic?.title ?? "Unknown topic"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subjectName && `${subjectName} · `}
                      {review.difficultySelected}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(review.reviewedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
