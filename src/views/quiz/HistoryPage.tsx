"use client";

import { useState } from "react";
import { useSessions, useSessionDetail } from "@/hooks/useQuiz";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/types/quiz";
import type { QuizSession, QuizSessionAnswer, Question } from "@/types/quiz";

type View = "list" | "detail";

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("list");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useSessions(page);
  const { data: sessionDetail, isLoading: detailLoading, isError: detailError } = useSessionDetail(selectedSessionId);

  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    setView("detail");
  };

  if (view === "detail") {
    if (detailLoading) {
      return (
        <PageShell maxWidth="narrow">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </PageShell>
      );
    }
    if (detailError || !sessionDetail) {
      return (
        <PageShell maxWidth="narrow">
          <div className="py-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setView("list"); setSelectedSessionId(null); }}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
            <p className="text-sm text-red-500">Failed to load session details.</p>
          </div>
        </PageShell>
      );
    }
    const { session, answers } = sessionDetail;
    const pct = session.totalQuestions > 0
      ? Math.round((session.score / session.totalQuestions) * 100)
      : 0;

    return (
      <PageShell maxWidth="narrow">
        <div className="py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setView("list"); setSelectedSessionId(null); }}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Session Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Mode:</span>{" "}
                  <Badge variant="outline">{session.mode.replace("_", " ")}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Score:</span>{" "}
                  {session.score}/{session.totalQuestions} ({pct}%)
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>{" "}
                  {new Date(session.startedAt).toLocaleDateString()}
                </div>
                {session.timeTakenSeconds != null && (
                  <div>
                    <span className="text-muted-foreground">Time:</span>{" "}
                    {formatTime(session.timeTakenSeconds)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
              {answers.map((answer: any) => (
                <Card key={answer.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {answer.isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{answer.question?.question ?? "Question"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Your answer: {answer.selectedAnswer}
                        {!answer.isCorrect && (
                          <> · Correct: {answer.question?.answer ?? "N/A"}</>
                        )}
                      </p>
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

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-8 space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell>
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Attempt History</h1>
          <p className="mt-4 text-sm text-red-500">
            {error instanceof Error ? error.message : "Failed to load history."}
          </p>
        </div>
      </PageShell>
    );
  }

  if (!data || data.sessions.length === 0) {
    return (
      <PageShell>
        <EmptyState
          icon="📋"
          title="No attempt history"
          description="Complete a quiz session to see it here."
        />
      </PageShell>
    );
  }

  const { sessions, pagination } = data;

  return (
    <PageShell>
      <div className="py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Attempt History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your past quiz sessions.
        </p>

        <div className="mt-6 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session: QuizSession) => {
                const pct = session.totalQuestions > 0
                  ? Math.round((session.score / session.totalQuestions) * 100)
                  : 0;
                return (
                  <TableRow key={session.id} className="cursor-pointer" onClick={() => handleSelectSession(session.id)}>
                    <TableCell className="text-sm">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {session.mode.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-medium",
                        pct >= 75 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-500",
                      )}>
                        {session.score}/{session.totalQuestions} ({pct}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {session.timeTakenSeconds != null ? formatTime(session.timeTakenSeconds) : "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} sessions)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
