// ─── Core Data Shapes ───────────────────────────────────────────────────

/** Difficulty levels for quiz questions. */
export type QuestionDifficulty = "easy" | "medium" | "hard";

/** Supported quiz session modes. */
export type QuizSessionMode = "quick_practice" | "mock_test" | "topic_set";

/** A topic-scoped collection of questions generated from study material. */
export interface QuestionSet {
  id: string;
  userId: string;
  topicId: string;
  title: string;
  extraContext: string | null;
  questionCount: number;
  difficulty: QuestionDifficulty | "mixed";
  timeLimit: number | null;
  materialId: string | null;
  createdAt: string;
}

/** A single multiple-choice question within a question set. */
export interface Question {
  id: string;
  questionSetId: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string | null;
  difficulty: QuestionDifficulty;
  tags: string[];
  createdAt: string;
}

/** A single quiz attempt session. */
export interface QuizSession {
  id: string;
  userId: string;
  questionSetId: string | null;
  mode: QuizSessionMode;
  score: number;
  totalQuestions: number;
  timeTakenSeconds: number | null;
  metadata: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
}

/** A single answer recorded within a quiz session. */
export interface QuizSessionAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean;
  timeTakenSeconds: number | null;
  createdAt: string;
  question?: Pick<Question, "question" | "answer" | "explanation"> | null;
}

/** Saved configuration for a mock test. */
export interface MockTestConfig {
  id: string;
  userId: string;
  subjectId: string | null;
  topicId: string | null;
  questionCount: number;
  timeLimitMinutes: number;
  difficulty: QuestionDifficulty | "mixed";
  createdAt: string;
}

// ─── API Request / Response Types ───────────────────────────────────────

/** Request body for starting a quick-practice session. */
export interface StartQuickPracticeRequest {
  count?: number;
}

/** Request body for starting a topic-set session. */
export interface StartTopicSetRequest {
  questionSetId: string;
}

/** Request body for starting a mock-test session. */
export interface StartMockTestRequest {
  subjectId?: string;
  topicId?: string;
  count: number;
  timeLimitMinutes: number;
  difficulty: QuestionDifficulty | "mixed";
}

/** Request body for submitting a single answer. */
export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
}

/** A question set row enriched with topic/material names and attempt status. */
export interface QuestionSetListItem extends QuestionSet {
  topicName: string | null;
  materialName: string | null;
  attempted: boolean;
}

/** Response returned after submitting an answer. */
export interface SubmitAnswerResponse {
  isCorrect: boolean;
  answer: string;
  explanation: string | null;
}

/** Request body for completing (finalising) a session. */
export interface CompleteSessionRequest {
  sessionId: string;
}

/** A session together with its full answer list. */
export interface QuizSessionSummary {
  session: QuizSession;
  answers: QuizSessionAnswer[];
}

// ─── Performance / Analytics Types ──────────────────────────────────────

/** Aggregated performance data scoped to a single subject. */
export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
}

/** Aggregated performance data scoped to a single topic. */
export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectName: string | null;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
}

/** Accuracy broken down by difficulty level. */
export interface DifficultyDistribution {
  difficulty: QuestionDifficulty;
  total: number;
  correct: number;
  accuracy: number;
}

/** Accuracy snapshot for a single day. */
export interface AccuracyOverTime {
  date: string;
  accuracy: number;
  totalQuestions: number;
}

/** A topic identified as a weak area based on accuracy. */
export interface WeakTopic {
  topicId: string;
  topicName: string;
  accuracy: number;
  totalAttempts: number;
}

/** Top-level performance data object returned by the performance API. */
export interface PerformanceData {
  overallAccuracy: number;
  totalSessions: number;
  totalQuestions: number;
  streakDays: number;
  accuracyOverTime: AccuracyOverTime[];
  bySubject: SubjectPerformance[];
  byTopic: TopicPerformance[];
  difficultyDistribution: DifficultyDistribution[];
  weakestTopics: WeakTopic[];
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Calculate the percentage score rounded to the nearest integer. */
export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Randomly pick `count` items from an array using Fisher–Yates shuffle. */
export function pickQuestions<T>(questions: T[], count: number): T[] {
  const clippedCount = Math.max(0, Math.min(count, questions.length));
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, clippedCount);
}

/** Format a duration in seconds to "m:ss" display format. */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Return a human-readable label for an accuracy percentage. */
export function getAccuracyLabel(accuracy: number): string {
  if (accuracy >= 90) return "Excellent";
  if (accuracy >= 75) return "Good";
  if (accuracy >= 60) return "Fair";
  return "Needs Improvement";
}

/** Return a Tailwind text colour class for an accuracy percentage. */
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-emerald-500";
  if (accuracy >= 75) return "text-blue-500";
  if (accuracy >= 60) return "text-amber-500";
  return "text-red-500";
}
