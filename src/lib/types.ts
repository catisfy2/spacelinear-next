export type TopicState =
  | "backlog"
  | "new"
  | "learning"
  | "reviewing"
  | "relearning";
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

export type { QuizQuestion, QuizResult } from '@/lib/quiz';
