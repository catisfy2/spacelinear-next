"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/hooks/useQuizSession";
import { cn } from "@/lib/utils";
import { formatTime, getAccuracyColor } from "@/types/quiz";
import { Loader2, ChevronLeft, ChevronRight, FileText } from "lucide-react";

export function QuizHistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSessions(page);

  return (
    <PageShell maxWidth="narrow">
      <PageHeader
        title="History"
        description="Review your past quiz sessions and view detailed report cards."
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.sessions.length ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No quiz sessions yet.{" "}
          <button
            type="button"
            onClick={() => router.push("/quiz/new")}
            className="text-primary underline underline-offset-2"
          >
            Generate your first quiz
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data.sessions.map((session) => {
              const accuracy =
                session.totalQuestions > 0
                  ? Math.round((session.score / session.totalQuestions) * 100)
                  : 0;
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Quiz</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        getAccuracyColor(accuracy),
                      )}
                    >
                      {accuracy}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.score}/{session.totalQuestions}
                    </p>
                  </div>
                  {session.timeTakenSeconds && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(session.timeTakenSeconds)}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      router.push(`/quiz/report?sessionId=${session.id}`)
                    }
                  >
                    <FileText className="size-3.5" />
                    Report Card
                  </Button>
                </div>
              );
            })}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) =>
                    p < data.pagination.totalPages ? p + 1 : p,
                  )
                }
                disabled={page >= data.pagination.totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
