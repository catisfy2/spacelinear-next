export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "true_false" | "short_answer";
export type QuizSessionMode = "quiz";
export type GenerationMode = "today" | "topic" | "custom" | "materials";
export type GenerationStatus = "queued" | "searching" | "generating" | "complete" | "error";

export interface QuestionSet {
  id: string;
  userId: string;
  topicId: string | null;
  title: string;
  extraContext: string | null;
  questionCount: number;
  difficulty: QuestionDifficulty | "mixed";
  timeLimit: number | null;
  materialId: string | null;
  generationMode: GenerationMode | null;
  generationStatus: GenerationStatus | null;
  generationError: string | null;
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
  questionType: QuestionType;
  tags: string[];
  subjectName: string | null;
  topicName: string | null;
  order: number;
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
  question?: Pick<Question, "question" | "answer" | "explanation" | "questionType" | "options"> | null;
}

export interface GenerateQuizRequest {
  mode: GenerationMode;
  topicIds?: string[];
  customTopic?: string;
  materialIds?: string[];
  questionCount: number;
  difficulty: QuestionDifficulty | "mixed";
  supplementWithWeb: boolean;
}

export interface GenerateQuizResponse {
  questionSetId: string;
}

export interface GenerationStatusResponse {
  status: GenerationStatus;
  progress: number;
  error?: string;
}

export interface StartSessionRequest {
  questionSetId: string;
}

export interface StartSessionResponse {
  session: QuizSession;
  questions: Pick<Question, "id" | "question" | "options" | "questionType" | "difficulty" | "tags" | "order">[];
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  answer: string;
  timeTakenSeconds?: number;
}

export interface SubmitAnswerResponse {
  stored: boolean;
}

export interface CompleteSessionRequest {
  sessionId: string;
  timeTakenSeconds?: number;
}

export interface CompleteSessionResponse {
  session: QuizSession;
  results: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string | null;
    isCorrect: boolean;
    questionType: QuestionType;
  }[];
}

export interface QuizSessionSummary {
  session: QuizSession;
  answers: QuizSessionAnswer[];
}

export interface DailyReport {
  date: string;
  quizzesTaken: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  totalTimeSeconds: number;
  uniqueTopics: number;
}

export interface WeeklyReport {
  weekStart: string;
  quizzesTaken: number;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  totalTimeSeconds: number;
  dailyBreakdown: DailyReport[];
}

export interface TopicGap {
  topicName: string;
  subjectName: string | null;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
}

export interface GapAnalysisReport {
  gaps: TopicGap[];
}

export function pickQuestions<T>(items: T[], count: number): T[] {
  if (items.length <= count) return [...items];
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
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
