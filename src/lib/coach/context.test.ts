import { describe, expect, it } from 'vitest';
import {
  buildCoachGreeting,
  detectTriggerType,
  getConsecutiveRelearnCount,
  hasFrictionKeywords,
  isSyllabusDump,
} from './context';
import type { ReviewHistoryEntry } from '@/lib/types';

function makeHistory(
  entries: Array<{ difficultySelected: ReviewHistoryEntry['difficultySelected']; reviewedAt: string }>,
  topicId = 'topic-1',
): ReviewHistoryEntry[] {
  return entries.map((entry, index) => ({
    id: `history-${index}`,
    topicId,
    reviewedAt: entry.reviewedAt,
    difficultySelected: entry.difficultySelected,
    intervalBeforeDays: 0,
    intervalAfterDays: 0,
    easeFactor: 2.5,
    reviewNumber: index + 1,
  }));
}

describe('getConsecutiveRelearnCount', () => {
  it('returns 0 when no topic is selected', () => {
    expect(getConsecutiveRelearnCount([], null)).toBe(0);
  });

  it('counts consecutive relearn entries from most recent', () => {
    const history = makeHistory([
      { difficultySelected: 'relearn', reviewedAt: '2026-05-24T12:00:00Z' },
      { difficultySelected: 'relearn', reviewedAt: '2026-05-23T12:00:00Z' },
      { difficultySelected: 'medium', reviewedAt: '2026-05-22T12:00:00Z' },
    ]);

    expect(getConsecutiveRelearnCount(history, 'topic-1')).toBe(2);
  });
});

describe('detectTriggerType', () => {
  it('detects friction from keywords', () => {
    expect(detectTriggerType('I feel stuck on this', 2, 0)).toBe('FRICTION');
  });

  it('detects friction from consecutive relearn count', () => {
    expect(detectTriggerType('help me', 2, 2)).toBe('FRICTION');
  });

  it('detects syllabus dump for long text', () => {
    const dump = 'Week 1: Intro\nWeek 2: Arrays\nWeek 3: Trees\n'.repeat(10);
    expect(detectTriggerType(dump, 2, 0)).toBe('SYLLABUS_DUMP');
  });

  it('detects onboarding when no subjects exist', () => {
    expect(detectTriggerType('hi', 0, 0)).toBe('ONBOARDING');
  });

  it('falls back to standard', () => {
    expect(detectTriggerType('quick question', 2, 0)).toBe('STANDARD');
  });
});

describe('hasFrictionKeywords', () => {
  it('matches procrastination keywords', () => {
    expect(hasFrictionKeywords('I keep procrastinating')).toBe(true);
    expect(hasFrictionKeywords('All good today')).toBe(false);
  });
});

describe('isSyllabusDump', () => {
  it('detects multi-line dumps', () => {
    expect(isSyllabusDump('Line 1\nLine 2\nLine 3')).toBe(true);
  });
});

describe('buildCoachGreeting', () => {
  it('uses onboarding greeting for empty workspace', () => {
    expect(buildCoachGreeting(0, false)).toContain('subjects');
  });

  it('uses friction greeting when active', () => {
    expect(buildCoachGreeting(2, true)).toContain('Unblock Method');
  });
});
