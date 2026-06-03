import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  QuestionSet,
  QuestionSetListItem,
  Question,
  QuizSession,
  QuizSessionAnswer,
  QuizSessionSummary,
  PerformanceData,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
} from "@/types/quiz";

/** Map a raw DB row to a camelCase QuestionSet. */
function mapQuestionSet(row: any): QuestionSet {
  return {
    id: row.id,
    userId: row.user_id,
    topicId: row.topic_id,
    title: row.title,
    extraContext: row.extra_context ?? null,
    questionCount: row.question_count,
    difficulty: row.difficulty ?? "mixed",
    timeLimit: row.time_limit ?? null,
    materialId: row.material_id ?? null,
    createdAt: row.created_at,
  };
}

/** Map a raw DB row to a camelCase Question. */
function mapQuestion(row: any): Question {
  return {
    id: row.id,
    questionSetId: row.question_set_id,
    question: row.question,
    options: row.options ?? [],
    answer: row.answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

/** Map a raw DB row to a camelCase QuizSession. */
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

/** Map a raw DB row to a camelCase QuizSessionAnswer. */
function mapAnswer(row: any): QuizSessionAnswer {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    selectedAnswer: row.selected_answer,
    isCorrect: row.is_correct,
    timeTakenSeconds: row.time_taken_seconds,
    createdAt: row.created_at,
  };
}

/** Retrieve the current Supabase access token for the session. */
async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("No active session");
  return data.session.access_token;
}

// ─── Question Sets ──────────────────────────────────────────────────────

/** Fetch all question sets for the current user (list-item shape). */
export function useQuestionSets() {
  return useQuery({
    queryKey: ["question-sets"],
    queryFn: async (): Promise<QuestionSetListItem[]> => {
      const token = await getAccessToken();
      const res = await fetch(`/api/quiz/sets?accessToken=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Failed to fetch question sets");
      const data = await res.json();
      return data.sets;
    },
  });
}

// ─── All Questions ──────────────────────────────────────────────────────

/** Fetch questions, optionally filtered by question set ID. */
export function useQuestions(questionSetId?: string) {
  return useQuery({
    queryKey: ["questions", questionSetId],
    queryFn: async (): Promise<Question[]> => {
      const token = await getAccessToken();
      const params = new URLSearchParams({ accessToken: token });
      if (questionSetId) params.set("questionSetId", questionSetId);
      const res = await fetch(`/api/quiz/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      const data = await res.json();
      return data.questions;
    },
    enabled: true,
  });
}

// ─── Quick Practice ─────────────────────────────────────────────────────

/** Start a quick-practice session with randomised questions. */
export function useStartQuickPractice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (count?: number) => {
      const token = await getAccessToken();
      const res = await fetch("/api/quiz/quick-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: count ?? 10, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to start quick practice");
      }
      const data = await res.json();
      return {
        session: mapSession(data.session),
        questions: data.questions,
      } as {
        session: QuizSession;
        questions: Pick<Question, "id" | "question" | "options" | "difficulty" | "tags">[];
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
}

// ─── Topic Set ──────────────────────────────────────────────────────────

/** Start a quiz session for a specific question set. */
export function useStartTopicSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionSetId: string) => {
      const token = await getAccessToken();
      const res = await fetch("/api/quiz/topic-set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionSetId, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to start topic set");
      }
      const data = await res.json();
      return {
        session: mapSession(data.session),
        questions: data.questions,
        set: data.set,
      } as {
        session: QuizSession;
        questions: Pick<Question, "id" | "question" | "options" | "difficulty" | "tags">[];
        set: QuestionSet;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
}

// ─── Mock Test ──────────────────────────────────────────────────────────

/** Start a mock-test session with configurable subject, topic, count, and difficulty. */
export function useStartMockTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: {
      subjectId?: string;
      topicId?: string;
      count: number;
      timeLimitMinutes: number;
      difficulty: string;
    }) => {
      const token = await getAccessToken();
      const res = await fetch("/api/quiz/mock-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to start mock test");
      }
      const data = await res.json();
      return {
        session: mapSession(data.session),
        questions: data.questions,
        timeLimitMinutes: data.timeLimitMinutes,
      } as {
        session: QuizSession;
        questions: Pick<Question, "id" | "question" | "options" | "difficulty" | "tags">[];
        timeLimitMinutes: number;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
    },
  });
}

// ─── Submit Answer ──────────────────────────────────────────────────────

/** Submit a single answer for the current session question. */
export function useSubmitAnswer() {
  return useMutation({
    mutationFn: async (req: SubmitAnswerRequest & { timeTakenSeconds?: number }) => {
      const token = await getAccessToken();
      const res = await fetch("/api/quiz/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit answer");
      }
      return res.json() as Promise<SubmitAnswerResponse>;
    },
  });
}

// ─── Complete Session ───────────────────────────────────────────────────

/** Complete (finalise) a quiz session, optionally recording total time. */
export function useCompleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sessionId,
      timeTakenSeconds,
    }: {
      sessionId: string;
      timeTakenSeconds?: number;
    }) => {
      const token = await getAccessToken();
      const res = await fetch("/api/quiz/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, timeTakenSeconds, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to complete session");
      }
      const completeData = await res.json();
      return { session: mapSession(completeData.session) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-performance"] });
    },
  });
}

// ─── Sessions List ──────────────────────────────────────────────────────

/** Fetch a paginated list of completed quiz sessions. */
export function useSessions(page: number = 1, mode?: string) {
  return useQuery({
    queryKey: ["quiz-sessions", page, mode],
    queryFn: async () => {
      const token = await getAccessToken();
      const params = new URLSearchParams({ accessToken: token, page: String(page), limit: "20" });
      if (mode) params.set("mode", mode);
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

// ─── Session Detail ─────────────────────────────────────────────────────

/** Fetch a single session together with its answers and question details. */
export function useSessionDetail(sessionId: string | null) {
  return useQuery({
    queryKey: ["quiz-session", sessionId],
    queryFn: async (): Promise<QuizSessionSummary> => {
      if (!sessionId) throw new Error("No session ID");
      const token = await getAccessToken();
      const res = await fetch(`/api/quiz/sessions/${sessionId}?accessToken=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      const data = await res.json();
      return {
        session: mapSession(data.session),
        answers: (data.answers ?? []).map((a: any) => ({
          ...mapAnswer(a),
          question: a.question ?? null,
        })),
      };
    },
    enabled: !!sessionId,
  });
}

// ─── Update Question Set ───────────────────────────────────────────────

/** Update a question set's title, topic, and/or material link. */
export function useUpdateQuestionSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      setId,
      title,
      topicId,
      materialId,
    }: {
      setId: string;
      title?: string;
      topicId?: string;
      materialId?: string | null;
    }) => {
      const token = await getAccessToken();
      const res = await fetch(`/api/quiz/sets/${setId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, topicId, materialId, accessToken: token }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update question set");
      }
      return res.json() as Promise<{ set: QuestionSet }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-sets"] });
    },
  });
}

// ─── Performance Data ───────────────────────────────────────────────────

/** Fetch aggregated performance/analytics data for the current user. */
export function usePerformanceData() {
  return useQuery({
    queryKey: ["quiz-performance"],
    queryFn: async (): Promise<PerformanceData> => {
      const token = await getAccessToken();
      const res = await fetch(`/api/quiz/performance?accessToken=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Failed to fetch performance data");
      return res.json();
    },
  });
}
