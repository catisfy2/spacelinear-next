"use client";

import { useInsights } from "@/hooks/useQuiz";
import { PageShell } from "@/components/app/PageShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/app/EmptyState";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  BrainCircuit,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  Flame,
} from "lucide-react";
import { getAccuracyColor } from "@/types/quiz";

export function InsightsPage() {
  const { data: insights, isLoading, error } = useInsights();

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

  if (error && !insights) {
    return (
      <PageShell>
        <div className="py-8">
          <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
          <p className="mt-4 text-sm text-red-500">
            {error instanceof Error ? error.message : "Failed to load insights."}
          </p>
        </div>
      </PageShell>
    );
  }

  if (!insights || (insights.topicStudy.totalLifetimeReviews === 0 && insights.quizPerformance.totalSessions === 0)) {
    return (
      <PageShell>
        <EmptyState
          icon="📊"
          title="No insights yet"
          description="Start reviewing topics and completing quiz sessions to see your combined study insights."
        />
      </PageShell>
    );
  }

  const { topicStudy, quizPerformance, activity, weakestSrsTopics, weakestQuizTopics, recommendations } = insights;

  return (
    <PageShell>
      <div className="py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
            <p className="text-sm text-muted-foreground">
              Combined view of your study progress and quiz performance.
            </p>
          </div>
        </div>

        {/* Recommendations banner */}
        {recommendations.filter(Boolean).length > 0 && (
          <div className="space-y-2">
            {recommendations.filter(Boolean).map((rec, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  rec.priority === "high"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                    : "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20"
                }`}
              >
                {rec.priority === "high" ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                ) : (
                  <Zap className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{rec.message}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-xs ${
                      rec.priority === "high"
                        ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
                        : "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {rec.priority === "high" ? "Action needed" : "Suggestion"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                SRS Accuracy
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getAccuracyColor(topicStudy.overallSrsAccuracy)}`}>
                {topicStudy.overallSrsAccuracy}%
              </p>
              <p className="text-xs text-muted-foreground">
                {topicStudy.totalLifetimeReviews} total reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Quiz Accuracy
              </CardTitle>
              <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getAccuracyColor(quizPerformance.overallAccuracy)}`}>
                {quizPerformance.overallAccuracy}%
              </p>
              <p className="text-xs text-muted-foreground">
                {quizPerformance.totalQuestions} questions answered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Topics Due
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${
                topicStudy.dueCount > 0 ? "text-amber-500" : "text-emerald-500"
              }`}>
                {topicStudy.dueCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {topicStudy.learningCount} learning, {topicStudy.reviewingCount} reviewing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Activity
              </CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {activity.activeDaysLast7}/7
              </p>
              <p className="text-xs text-muted-foreground">
                {activity.activeDaysLast30} days this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SRS Topic Study */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Topic Study Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-5 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-500">{topicStudy.newCount}</p>
                <p className="text-xs text-muted-foreground">New</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-amber-500">{topicStudy.learningCount}</p>
                <p className="text-xs text-muted-foreground">Learning</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-emerald-500">{topicStudy.reviewingCount}</p>
                <p className="text-xs text-muted-foreground">Reviewing</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-red-500">{topicStudy.relearningCount}</p>
                <p className="text-xs text-muted-foreground">Relearning</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-purple-500">{topicStudy.avgReviewsPerTopic}</p>
                <p className="text-xs text-muted-foreground">Avg Reviews/Topic</p>
              </div>
            </div>
            <Progress
              value={(topicStudy.totalCorrectReviews / Math.max(topicStudy.totalLifetimeReviews, 1)) * 100}
              className="h-2"
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {topicStudy.totalCorrectReviews}/{topicStudy.totalLifetimeReviews} correct reviews
            </p>
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="h-5 w-5" />
              Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{quizPerformance.completedSessions}</p>
                <p className="text-xs text-muted-foreground">Completed Sessions</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{quizPerformance.totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Total Questions</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className={`text-2xl font-bold ${getAccuracyColor(quizPerformance.overallAccuracy)}`}>
                  {quizPerformance.overallAccuracy}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weakest SRS Topics */}
        {weakestSrsTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weakest SRS Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakestSrsTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{topic.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({topic.state}, {topic.totalReviews} reviews)
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getAccuracyColor(topic.accuracy)}`}>
                      {topic.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weakest Quiz Topics */}
        {weakestQuizTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weakest Quiz Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weakestQuizTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm">{topic.topicName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {topic.correctCount}/{topic.totalAttempts} correct
                      </span>
                      <span className={`text-sm font-medium ${getAccuracyColor(topic.accuracy)}`}>
                        {topic.accuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  {activity.lastActiveDate
                    ? new Date(activity.lastActiveDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last Active</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{activity.activeDaysLast7}</p>
                <p className="text-xs text-muted-foreground">Days (last 7)</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{activity.activeDaysLast30}</p>
                <p className="text-xs text-muted-foreground">Days (last 30)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
