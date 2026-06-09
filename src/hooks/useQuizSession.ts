"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  QuizSession,
  Question,
  StartSessionResponse,
  CompleteSessionResponse,
  QuizSessionSummary,
} from "@/types/quiz";

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("No active session");
  return data.session.access_token;
}

function mapSession(row: any): QuizSession {
  return {
    id: row.id,
    userId: row.user_id,
    questionSetId: row.question_set_id,
    mode: row.mode,
    score: row.score,
    totalQuestions: row.total_questions,
    timeTakenSeconds: row.time_taken_seconds,
    metadata: row.metadata ?? {},
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function useStartQuizSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      questionSetId: string,
    ): Promise<StartSessionResponse> => {
      const token = await getAccessToken();
      const res = await fetch("/api/quiz/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionSetId, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to start session");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: async ({
      sessionId,
      questionId,
      answer,
      timeTakenSeconds,
    }: {
      sessionId: string;
      questionId: string;
      answer: string;
      timeTakenSeconds?: number;
    }) => {
      const token = await getAccessToken();
      const res = await fetch(`/api/quiz/sessions/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          answer,
          timeTakenSeconds,
          accessToken: token,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit answer");
      }
      return res.json() as Promise<{ stored: boolean }>;
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      timeTakenSeconds,
    }: {
      sessionId: string;
      timeTakenSeconds?: number;
    }): Promise<CompleteSessionResponse> => {
      const token = await getAccessToken();
      const res = await fetch(`/api/quiz/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeTakenSeconds, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to complete session");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
}

export function useSessions(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["quiz-sessions", page, limit],
    queryFn: async () => {
      const token = await getAccessToken();
      const params = new URLSearchParams({
        accessToken: token,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/quiz/sessions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      return {
        sessions: (data.sessions ?? []).map(mapSession),
        pagination: data.pagination,
      } as {
        sessions: QuizSession[];
        pagination: { page: number; total: number; totalPages: number };
      };
    },
  });
}

export function useSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ["quiz-session", sessionId],
    queryFn: async (): Promise<QuizSessionSummary> => {
      if (!sessionId) throw new Error("No session ID");
      const token = await getAccessToken();
      const res = await fetch(
        `/api/quiz/sessions/${sessionId}?accessToken=${encodeURIComponent(token)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch session");
      const data = await res.json();
      return {
        session: mapSession(data.session),
        answers: (data.answers ?? []).map((a: any) => ({
          id: a.id,
          sessionId: a.session_id,
          questionId: a.question_id,
          selectedAnswer: a.selected_answer,
          isCorrect: a.is_correct,
          timeTakenSeconds: a.time_taken_seconds,
          createdAt: a.created_at,
          question: a.question ?? null,
        })),
      };
    },
    enabled: !!sessionId,
  });
}
