"use client";

import { usePerformanceData } from "@/hooks/useQuiz";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { getAccuracyColor, getAccuracyLabel } from "@/types/quiz";

export function PerformancePage() {
  const { data: perf, isLoading, error } = usePerformanceData();

  if (isLoading) {
    return (
      <PageShell>
        <div className="py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Performance Analysis</h1>
          <p className="mt-4 text-sm text-red-500">
            {error instanceof Error ? error.message : "Failed to load performance data."}
          </p>
        </div>
      </PageShell>
    );
  }

  if (!perf) {
    return (
      <PageShell>
        <EmptyState
          icon="📊"
          title="No performance data yet"
          description="Complete some quiz sessions to see your performance analytics."
        />
      </PageShell>
    );
  }

  if (perf.totalSessions === 0) {
    return (
      <PageShell>
        <EmptyState
          icon="📊"
          title="No performance data yet"
          description="Complete some quiz sessions to see your performance analytics."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="py-8 space-y-8">
        <h1 className="text-2xl font-semibold tracking-tight">Performance Analysis</h1>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Overall Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getAccuracyColor(perf.overallAccuracy)}`}>
                {perf.overallAccuracy}%
              </p>
              <p className="text-xs text-muted-foreground">
                {getAccuracyLabel(perf.overallAccuracy)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{perf.totalSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Questions Answered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{perf.totalQuestions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Day Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{perf.streakDays}</p>
              <p className="text-xs text-muted-foreground">consecutive days</p>
            </CardContent>
          </Card>
        </div>

        {/* Accuracy over time */}
        {perf.accuracyOverTime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accuracy Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={perf.accuracyOverTime}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(d) => {
                        const date = new Date(d);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Subject */}
        {perf.bySubject.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf.bySubject}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="subjectName" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* By Topic */}
        {perf.byTopic.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">By Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf.byTopic}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="topicName" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Difficulty distribution */}
        {perf.difficultyDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Difficulty Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf.difficultyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weakest Topics */}
        {perf.weakestTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weakest Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {perf.weakestTopics.map((topic) => (
                  <div key={topic.topicId} className="flex items-center justify-between">
                    <span className="text-sm">{topic.topicName}</span>
                    <span className={`text-sm font-medium ${getAccuracyColor(topic.accuracy)}`}>
                      {topic.accuracy}% ({topic.totalAttempts} questions)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
