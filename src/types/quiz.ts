// ─── Core Data Shapes ───────────────────────────────────────────────────

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuizSessionMode = "quick_practice" | "mock_test" | "topic_set";

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

export interface StartQuickPracticeRequest {
  count?: number;
}

export interface StartTopicSetRequest {
  questionSetId: string;
}

export interface StartMockTestRequest {
  subjectId?: string;
  topicId?: string;
  count: number;
  timeLimitMinutes: number;
  difficulty: QuestionDifficulty | "mixed";
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
}

export interface QuestionSetListItem extends QuestionSet {
  topicName: string | null;
  materialName: string | null;
  attempted: boolean;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
  answer: string;
  explanation: string | null;
}

export interface CompleteSessionRequest {
  sessionId: string;
}

export interface QuizSessionSummary {
  session: QuizSession;
  answers: QuizSessionAnswer[];
}

// ─── Performance / Analytics Types ──────────────────────────────────────

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectName: string | null;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
}

export interface DifficultyDistribution {
  difficulty: QuestionDifficulty;
  total: number;
  correct: number;
  accuracy: number;
}

export interface AccuracyOverTime {
  date: string;
  accuracy: number;
  totalQuestions: number;
}

export interface WeakTopic {
  topicId: string;
  topicName: string;
  accuracy: number;
  totalAttempts: number;
}

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

export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function pickQuestions<T>(questions: T[], count: number): T[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getAccuracyLabel(accuracy: number): string {
  if (accuracy >= 90) return "Excellent";
  if (accuracy >= 75) return "Good";
  if (accuracy >= 60) return "Fair";
  return "Needs Improvement";
}

export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return "text-emerald-500";
  if (accuracy >= 75) return "text-blue-500";
  if (accuracy >= 60) return "text-amber-500";
  return "text-red-500";
}
