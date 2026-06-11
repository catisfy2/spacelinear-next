"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useAuth } from "./useAuth";

export interface DocsLiveMetrics {
  totalTopics: number;
  totalReviews: number;
  subjectsCount: number;
  topicsByState: { new: number; learning: number; reviewing: number; relearning: number; backlog: number; archived: number };
  averageRetention: number;
  totalQuizSessions: number;
  quizAccuracy: number;
  streak: number;
  activeDays: number;
  userDisplayName: string;
}

export function useDocsLiveData(): DocsLiveMetrics {
  const { user } = useAuth();
  const { topics, reviewHistory, subjects } = useStore();

  return useMemo(() => {
    const topicsByState = {
      new: topics.filter((t) => t.state === "new").length,
      learning: topics.filter((t) => t.state === "learning").length,
      reviewing: topics.filter((t) => t.state === "reviewing").length,
      relearning: topics.filter((t) => t.state === "relearning").length,
      backlog: topics.filter((t) => t.state === "backlog").length,
      archived: topics.filter((t) => t.state === "archived").length,
    };

    const correctReviews = reviewHistory.filter((r) =>
      ["easy", "medium"].includes(r.difficultySelected)
    ).length;
    const averageRetention =
      reviewHistory.length > 0
        ? Math.round((correctReviews / reviewHistory.length) * 100)
        : 0;

    const uniqueDays = new Set(
      reviewHistory.map((r) => new Date(r.reviewedAt).toDateString())
    ).size;

    const topicsWithAttempts = topics.filter(
      (t) => t.correctReviews + t.totalReviews > 0
    );
    const streak = topicsWithAttempts.reduce(
      (max, t) => Math.max(max, t.streak),
      0
    );

    return {
      totalTopics: topics.length,
      totalReviews: reviewHistory.length,
      subjectsCount: subjects.length,
      topicsByState,
      averageRetention,
      totalQuizSessions: 0,
      quizAccuracy: 0,
      streak,
      activeDays: uniqueDays,
      userDisplayName:
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Anonymous",
    };
  }, [topics, reviewHistory, subjects, user]);
}
