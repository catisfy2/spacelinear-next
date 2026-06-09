export type TopicState =
  | "backlog"
  | "new"
  | "learning"
  | "reviewing"
  | "relearning"
  | "archived";
export type Difficulty = "relearn" | "hard" | "medium" | "easy";

export interface Subject {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  planId?: string;
  title: string;
  description?: string;
  notes?: string;
  tags: string[];
  state: TopicState;
  currentDifficulty?: Difficulty;
  nextReviewDate: string;
  currentIntervalDays: number;
  easeFactor: number;
  totalReviews: number;
  correctReviews: number;
  streak: number;
  firstReviewedAt?: string;
  lastReviewedAt?: string;
  createdAt: string;
}

export interface ReviewHistoryEntry {
  id: string;
  topicId: string;
  reviewedAt: string;
  difficultyBefore?: Difficulty;
  difficultySelected: Difficulty;
  intervalBeforeDays: number;
  intervalAfterDays: number;
  easeFactor: number;
  reviewNumber: number;
  commitMessage?: string;
}

export interface ReviewResult {
  updatedTopic: Topic;
  historyEntry: ReviewHistoryEntry;
}

export interface Resource {
  id: string;
  entityId: string;
  entityType: "topic" | "subject";
  type: "link" | "file" | "note_doc";
  title: string;
  url?: string;
  content?: string;
  createdAt: string;
}

// ── Material Types ──────────────────────────────────────────────────────

export type MaterialType = "folder" | "file" | "link" | "text";

export interface Material {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  type: MaterialType;
  mimeType?: string;
  fileSize?: number;
  storagePath?: string;
  url?: string;
  content?: string;
  metadata: Record<string, any>;
  isStarred: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Note Types ─────────────────────────────────────────────────────────

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  starred: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Chat Types ─────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

// ── Quiz Types ─────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  answer: string;
  tags: string[];
  subject?: string;
  topic?: string;
  materialId?: string;
  createdBy?: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  tags: string[];
  attemptedAt: string;
}

export interface GapAnalysis {
  tag: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
}

export interface QuizFilters {
  subject?: string;
  topic?: string;
}

// ── Study Plan Types ──────────────────────────────────────────────────

export type StudyPlanStatus = "generating" | "review" | "applied" | "archived";

export interface StudyPlanResource {
  title: string;
  url: string;
  type: "video" | "article" | "course" | "book" | "other";
  description: string;
}

export interface StudyPlanTopic {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_minutes: number;
  prerequisites: string[];
  order: number;
  resources: StudyPlanResource[];
  searchQuery?: string;
}

export interface StudyPlanSubject {
  name: string;
  description: string;
  topics: StudyPlanTopic[];
}

export interface StudyPlanData {
  subjects: StudyPlanSubject[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  title: string | null;
  prompt: string | null;
  description: string | null;
  planData: StudyPlanData | null;
  status: StudyPlanStatus;
  createdAt: string;
  updatedAt: string;
}
