export interface StudyCommit {
  id: string;
  userId: string;
  topicId: string | null;
  subjectName: string | null;
  topicName: string | null;
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard" | "review";
  notes: string | null;
  committedAt: string;
}

export interface AgentMemory {
  id: string;
  userId: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AgentEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  createdAt: string;
  notifiedAt: string | null;
}

export interface MochiSettings {
  enabled: boolean;
  tone: "friendly" | "professional";
  maxCrons: number;
}

export interface MochiCron {
  id: string;
  userId: string;
  label: string;
  cronExpr: string;
  prompt: string | null;
  enabled: boolean;
  lastRunAt: string | null;
}

export interface MochiMessage {
  id: string;
  userId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  toolCalls: unknown | null;
  toolResult: string | null;
  createdAt: string;
}

export interface WeeklyProgress {
  quizzesTaken: number;
  questionsAnswered: number;
  totalTimeSeconds: number;
  accuracy: number;
  dailyBreakdown: { date: string; accuracy: number }[];
}

export interface DailyDigest {
  studyCommits: number;
  totalMinutes: number;
  quizzesCompleted: number;
  averageAccuracy: number | null;
  streak: number;
  subjectsStudied: string[];
}
