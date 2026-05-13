import { addDays, startOfDay } from 'date-fns';
import type { ReviewHistoryEntry, Subject, Topic } from '@/lib/types';

function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Share of last-30d reviews rated Good (medium) or Easy. */
export function getRecentRetention30d(reviewHistory: ReviewHistoryEntry[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30d = reviewHistory.filter((h) => new Date(h.reviewedAt) >= thirtyDaysAgo);
  if (last30d.length === 0) return 0;
  const good = last30d.filter(
    (h) => h.difficultySelected === 'medium' || h.difficultySelected === 'easy',
  ).length;
  return Math.round((good / last30d.length) * 100);
}

export function getMaxTopicStreak(topics: Topic[]): number {
  return topics.reduce((max, t) => Math.max(max, t.streak), 0);
}

/** Consecutive calendar days ending today with at least one review (local dates). */
export function getCalendarReviewStreak(reviewHistory: ReviewHistoryEntry[]): number {
  const days = new Set<string>();
  for (const h of reviewHistory) {
    days.add(localDateKey(new Date(h.reviewedAt)));
  }
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const key = localDateKey(cursor);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function countDueTomorrow(topics: Topic[]): number {
  const today = startOfDay(new Date());
  const tomorrowStart = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  return topics.filter((t) => {
    const d = startOfDay(new Date(t.nextReviewDate));
    return d.getTime() >= tomorrowStart.getTime() && d.getTime() < dayAfter.getTime();
  }).length;
}

export function countDueThisWeek(topics: Topic[]): number {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  return topics.filter((t) => {
    const d = startOfDay(new Date(t.nextReviewDate));
    return d.getTime() >= today.getTime() && d.getTime() < weekEnd.getTime();
  }).length;
}

export type WeakestSubject = { subject: Subject; mastery: number; due: number } | null;

/** Subject with lowest mastery (easy/total); tie-break by higher due count. */
export function getWeakestSubject(subjects: Subject[], topics: Topic[]): WeakestSubject {
  let best: WeakestSubject = null;
  for (const subject of subjects) {
    const subjectTopics = topics.filter((t) => t.subjectId === subject.id);
    const total = subjectTopics.length;
    if (total === 0) continue;
    const easy = subjectTopics.filter((t) => t.currentDifficulty === 'easy').length;
    const due = subjectTopics.filter((t) => new Date(t.nextReviewDate) <= new Date()).length;
    const mastery = Math.round((easy / total) * 100);
    if (
      !best ||
      mastery < best.mastery ||
      (mastery === best.mastery && due > best.due)
    ) {
      best = { subject, mastery, due };
    }
  }
  return best;
}

export function buildPulseStats(topics: Topic[], reviewHistory: ReviewHistoryEntry[]) {
  const now = new Date();
  const dueNow = topics.filter((t) => new Date(t.nextReviewDate) <= now).length;
  const totalReviews = reviewHistory.length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30d = reviewHistory.filter((h) => new Date(h.reviewedAt) >= thirtyDaysAgo);
  const recentRetention =
    last30d.length > 0
      ? Math.round(
          (last30d.filter(
            (h) => h.difficultySelected === 'medium' || h.difficultySelected === 'easy',
          ).length /
            last30d.length) *
            100,
        )
      : 0;

  const stateBreakdown = {
    new: topics.filter((t) => t.state === 'new').length,
    learning: topics.filter((t) => t.state === 'learning').length,
    reviewing: topics.filter((t) => t.state === 'reviewing').length,
    relearning: topics.filter((t) => t.state === 'relearning').length,
  };

  const maxStreak = getMaxTopicStreak(topics);

  return {
    dueNow,
    totalReviews,
    recentRetention,
    stateBreakdown,
    maxStreak,
    last30dCount: last30d.length,
  };
}
