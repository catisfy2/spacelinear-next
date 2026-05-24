import type { ReviewHistoryEntry } from '@/lib/types';

export type CoachTriggerType =
  | 'ONBOARDING'
  | 'SYLLABUS_DUMP'
  | 'FRICTION'
  | 'STANDARD';

export interface CoachContextPayload {
  triggerType: CoachTriggerType;
  activeTopicId?: string;
  consecutiveRelearnCount?: number;
}

const FRICTION_KEYWORDS = [
  'stuck',
  'overwhelmed',
  'procrastinating',
  'procrastinate',
  'cant focus',
  "can't focus",
  'no motivation',
  'giving up',
];

export function getConsecutiveRelearnCount(
  reviewHistory: ReviewHistoryEntry[],
  topicId: string | null | undefined,
): number {
  if (!topicId) return 0;

  const topicHistory = reviewHistory
    .filter((entry) => entry.topicId === topicId)
    .sort(
      (a, b) =>
        new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    );

  let count = 0;
  for (const entry of topicHistory) {
    if (entry.difficultySelected === 'relearn') {
      count += 1;
    } else {
      break;
    }
  }

  return count;
}

export function hasFrictionKeywords(text: string): boolean {
  const normalized = text.toLowerCase();
  return FRICTION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function isSyllabusDump(text: string): boolean {
  const trimmed = text.trim();
  const lineCount = trimmed.split('\n').filter((line) => line.trim()).length;
  return trimmed.length > 150 || lineCount >= 3;
}

export function detectTriggerType(
  text: string,
  subjectCount: number,
  consecutiveRelearnCount: number,
): CoachTriggerType {
  if (consecutiveRelearnCount >= 2 || hasFrictionKeywords(text)) {
    return 'FRICTION';
  }

  if (isSyllabusDump(text)) {
    return 'SYLLABUS_DUMP';
  }

  if (subjectCount === 0) {
    return 'ONBOARDING';
  }

  return 'STANDARD';
}

export function buildCoachGreeting(
  subjectCount: number,
  frictionActive: boolean,
): string {
  if (frictionActive) {
    return "I notice you've hit a wall on this topic. Let's pause and run the Unblock Method — starting with Clarity. What's the one thing about this material that feels most unclear right now?";
  }

  if (subjectCount === 0) {
    return "Welcome aboard! Let's build your study system right now. How many subjects are you juggling, and what's the one core topic that needs an immediate structural breakdown?";
  }

  return "Hey! I'm your SpaceLinear study coach. How many subjects are you balancing right now, and what's the one topic you'd love to make progress on today?";
}
