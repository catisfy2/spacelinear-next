"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  DailyReport,
  WeeklyReport,
  GapAnalysis,
  QuizSummary,
} from "@/components/quiz";
import { useSessionDetail, useSessions } from "@/hooks/useQuizSession";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { CompleteSessionResponse } from "@/types/quiz";

type ReportSubTab = "session" | "daily" | "weekly" | "gaps";

export function QuizReportPage({
  initialSessionId,
}: {
  initialSessionId?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReportSubTab>("session");
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >(initialSessionId);

  const { data: sessionDetail, isLoading: detailLoading } =
    useSessionDetail(selectedSessionId ?? null);

  const { data: recentData } = useSessions(1, 1);

  useEffect(() => {
    if (!selectedSessionId && recentData?.sessions.length) {
      setSelectedSessionId(recentData.sessions[0].id);
    }
  }, [selectedSessionId, recentData]);

  const { data: allSessions } = useSessions(1, 50);

  const computedResults = sessionDetail
    ? sessionDetail.answers.map((a) => ({
        questionId: a.questionId,
        question: a.question?.question ?? "",
        userAnswer: a.selectedAnswer ?? "",
        correctAnswer: a.question?.answer ?? "",
        explanation: a.question?.explanation ?? null,
        isCorrect: a.isCorrect,
        questionType: (a.question?.questionType ??
          "mcq") as CompleteSessionResponse["results"][number]["questionType"],
      }))
    : null;

  const subTabs: { key: ReportSubTab; label: string }[] = [
    { key: "session", label: "Session" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "gaps", label: "Gap Analysis" },
  ];

  return (
    <PageShell maxWidth="narrow">
      <PageHeader
        title="Report"
        description="View session results and aggregate performance."
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "session" && (
        <div className="space-y-4">
          {allSessions && allSessions.sessions.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">
                Session:
              </label>
              <select
                value={selectedSessionId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSessionId(val);
                  router.replace(`/quiz/report?sessionId=${val}`, {
                    scroll: false,
                  });
                }}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              >
                {allSessions.sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    — {s.score}/{s.totalQuestions}
                  </option>
                ))}
              </select>
            </div>
          )}

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : computedResults ? (
            <>
              <QuizSummary
                results={computedResults}
                timeTakenSeconds={sessionDetail?.session.timeTakenSeconds ?? null}
                totalQuestions={
                  sessionDetail?.session.totalQuestions ??
                  computedResults.length
                }
              />
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/quiz/history")}
                >
                  Back to History
                </Button>
                <Button onClick={() => router.push("/quiz/new")}>
                  New Quiz
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No completed sessions yet.{" "}
              <button
                type="button"
                onClick={() => router.push("/quiz/new")}
                className="text-primary underline underline-offset-2"
              >
                Generate your first quiz
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "daily" && <DailyReport />}
      {activeTab === "weekly" && <WeeklyReport />}
      {activeTab === "gaps" && <GapAnalysis />}
    </PageShell>
  );
}
