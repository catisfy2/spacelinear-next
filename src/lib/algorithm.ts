import { type Topic, type Difficulty, type ReviewResult, type ReviewHistoryEntry } from './types';

export type TopicAlgorithmState = {
  state: Topic['state'];
  correct_reviews: number;
  current_interval_days: number;
  ease_factor: number;
};

export type AlgorithmResult = {
  state: Topic['state'];
  correct_reviews: number;
  current_interval_days: number;
  ease_factor: number;
  next_review_date: Date;
};

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const LEARNING_STEPS = [1, 3, 7]; // days
export const GRADUATING_INTERVAL = 14; // days

const EASE_ADJUSTMENTS: Record<Difficulty, number> = {
  relearn: -0.2,
  hard: -0.15,
  medium: 0.0,
  easy: 0.15,
};

// --- Linear interval model ---
const BASE_INTERVALS: Record<Difficulty, number> = {
  relearn: 0,
  hard: 1,
  medium: 2,
  easy: 3,
};

const GROWTH_RATES: Record<string, number> = {
  hard: 1,
  medium: 2,
  easy: 3,
};

/**
 * Linear interval calculation.
 * First attempt: relearn=1, hard=1, medium=2, easy=3
 * Subsequent: base = 1 + (attemptNumber × growthRate[lastClicked])
 *   buttons: relearn=1, hard=base, medium=base+1, easy=base+2
 */
function calculateLinearIntervals(
  attemptNumber: number,
  lastClicked: Difficulty | undefined
): Record<Difficulty, number> {
  if (attemptNumber === 0 || !lastClicked || lastClicked === 'relearn') {
    return { ...BASE_INTERVALS };
  }

  const rate = GROWTH_RATES[lastClicked] ?? GROWTH_RATES.medium;
  const base = 1 + attemptNumber * rate;

  return {
    relearn: 0,
    hard: base,
    medium: base + 1,
    easy: base + 2,
  };
}

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ease));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Learning phase step mapping:
 *   Review #1 (correct 0→1): interval = LEARNING_STEPS[0] = 1d
 *   Review #2 (correct 1→2): interval = LEARNING_STEPS[1] = 3d
 *   Review #3 (correct 2→3): interval = LEARNING_STEPS[2] = 7d
 *   Review #4 (correct ≥3):  interval = 14d, GRADUATES
 *
 * Hard repeats the last completed step (LEARNING_STEPS[correct-1], min index 0).
 * Relearn resets correct_reviews to 0 with 1-day interval.
 */
function calculateLearningPhase(
  topic: TopicAlgorithmState,
  rating: Difficulty,
  now: Date
): AlgorithmResult {
  const newEase = clampEase(topic.ease_factor + EASE_ADJUSTMENTS[rating]);
  const activeState: Topic['state'] =
    topic.state === 'new' ? 'learning' : topic.state;

  if (rating === 'relearn') {
    return {
      state: activeState,
      correct_reviews: 0,
      current_interval_days: 0,
      ease_factor: newEase,
      next_review_date: addDays(now, 0),
    };
  }

  if (rating === 'hard') {
    const stepIndex = Math.min(
      Math.max(0, topic.correct_reviews - 1),
      LEARNING_STEPS.length - 1
    );
    const interval = LEARNING_STEPS[stepIndex];
    return {
      state: activeState,
      correct_reviews: topic.correct_reviews,
      current_interval_days: interval,
      ease_factor: newEase,
      next_review_date: addDays(now, interval),
    };
  }

  // medium or easy — check if graduating first
  if (topic.correct_reviews >= LEARNING_STEPS.length) {
    return {
      state: 'reviewing',
      correct_reviews: topic.correct_reviews + 1,
      current_interval_days: GRADUATING_INTERVAL,
      ease_factor: newEase,
      next_review_date: addDays(now, GRADUATING_INTERVAL),
    };
  }

  const interval = LEARNING_STEPS[topic.correct_reviews];
  return {
    state: activeState,
    correct_reviews: topic.correct_reviews + 1,
    current_interval_days: interval,
    ease_factor: newEase,
    next_review_date: addDays(now, interval),
  };
}

function calculateReviewPhase(
  topic: TopicAlgorithmState,
  rating: Difficulty,
  now: Date
): AlgorithmResult {
  const newEase = clampEase(topic.ease_factor + EASE_ADJUSTMENTS[rating]);

  if (rating === 'relearn') {
    return {
      state: 'relearning',
      correct_reviews: 0,
      current_interval_days: 0,
      ease_factor: newEase,
      next_review_date: addDays(now, 0),
    };
  }

  let interval: number;
  switch (rating) {
    case 'easy':
      interval = Math.max(1, Math.round(topic.current_interval_days * topic.ease_factor * 1.3));
      break;
    case 'medium':
      interval = Math.max(1, Math.round(topic.current_interval_days * topic.ease_factor));
      break;
    case 'hard':
      interval = Math.max(1, Math.round(topic.current_interval_days * 1.2));
      break;
  }

  return {
    state: 'reviewing',
    correct_reviews: topic.correct_reviews,
    current_interval_days: interval,
    ease_factor: newEase,
    next_review_date: addDays(now, interval),
  };
}

export function calculateNextReview(
  topic: TopicAlgorithmState,
  rating: Difficulty,
  now: Date = new Date()
): AlgorithmResult {
  if (topic.state === 'new' || topic.state === 'learning' || topic.state === 'relearning') {
    return calculateLearningPhase(topic, rating, now);
  }
  return calculateReviewPhase(topic, rating, now);
}

// --- Convenience wrappers used by the store and UI ---

function toAlgoState(topic: Topic): TopicAlgorithmState {
  return {
    state: topic.state,
    correct_reviews: topic.correctReviews,
    current_interval_days: topic.currentIntervalDays,
    ease_factor: topic.easeFactor,
  };
}

export function previewIntervals(topic: Topic): Record<Difficulty, number> {
  return calculateLinearIntervals(topic.totalReviews, topic.currentDifficulty);
}

export function processReview(topic: Topic, difficulty: Difficulty): ReviewResult {
  const now = new Date();
  const result = calculateNextReview(toAlgoState(topic), difficulty, now);

  // Use linear intervals for scheduling
  const intervals = calculateLinearIntervals(topic.totalReviews, topic.currentDifficulty);
  const selectedInterval = intervals[difficulty];

  const updatedTopic: Topic = {
    ...topic,
    state: result.state,
    currentDifficulty: difficulty,
    nextReviewDate: addDays(now, selectedInterval).toISOString(),
    currentIntervalDays: selectedInterval,
    easeFactor: result.ease_factor,
    totalReviews: difficulty === 'relearn' ? 0 : topic.totalReviews + 1,
    correctReviews: result.correct_reviews,
    streak: difficulty === 'relearn' || difficulty === 'hard' ? 0 : topic.streak + 1,
    firstReviewedAt: topic.firstReviewedAt || now.toISOString(),
    lastReviewedAt: now.toISOString(),
  };

  const historyEntry: ReviewHistoryEntry = {
    id: crypto.randomUUID(),
    topicId: topic.id,
    reviewedAt: now.toISOString(),
    difficultyBefore: topic.currentDifficulty,
    difficultySelected: difficulty,
    intervalBeforeDays: topic.currentIntervalDays,
    intervalAfterDays: selectedInterval,
    easeFactor: result.ease_factor,
    reviewNumber: topic.totalReviews + 1,
  };

  return { updatedTopic, historyEntry };
}
