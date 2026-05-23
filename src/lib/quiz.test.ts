import { describe, expect, it } from 'vitest';
import {
  computeQuizResult,
  hasQuizContent,
  scoreToDifficulty,
} from '@/lib/quiz';
import type { QuizQuestion, Resource, Topic } from '@/lib/types';

const sampleQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Question 1',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
  },
  {
    id: 'q2',
    question: 'Question 2',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 1,
  },
  {
    id: 'q3',
    question: 'Question 3',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 2,
  },
  {
    id: 'q4',
    question: 'Question 4',
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 3,
  },
];

describe('scoreToDifficulty', () => {
  it('maps score bands to review difficulty', () => {
    expect(scoreToDifficulty(0)).toBe('relearn');
    expect(scoreToDifficulty(25)).toBe('relearn');
    expect(scoreToDifficulty(40)).toBe('hard');
    expect(scoreToDifficulty(60)).toBe('medium');
    expect(scoreToDifficulty(90)).toBe('easy');
  });
});

describe('computeQuizResult', () => {
  it('derives suggested difficulty from quiz score', () => {
    const result = computeQuizResult(sampleQuestions, {
      q1: 0,
      q2: 1,
      q3: 2,
      q4: 0,
    });

    expect(result.correctCount).toBe(3);
    expect(result.totalCount).toBe(4);
    expect(result.scorePercent).toBe(75);
    expect(result.suggestedDifficulty).toBe('medium');
  });
});

describe('hasQuizContent', () => {
  const baseTopic = {
    id: '1',
    subjectId: 's1',
    title: 'Topic',
    tags: [],
    state: 'new',
    nextReviewDate: new Date().toISOString(),
    currentIntervalDays: 0,
    easeFactor: 2.5,
    totalReviews: 0,
    correctReviews: 0,
    streak: 0,
    createdAt: new Date().toISOString(),
  } as Topic;

  it('returns true when notes exist', () => {
    expect(hasQuizContent({ ...baseTopic, notes: 'Some notes' }, [])).toBe(true);
  });

  it('returns true when resources exist', () => {
    const resource = {
      id: 'r1',
      entityId: '1',
      entityType: 'topic',
      type: 'link',
      title: 'Link',
      createdAt: new Date().toISOString(),
    } as Resource;

    expect(hasQuizContent(baseTopic, [resource])).toBe(true);
  });

  it('returns false when no notes or resources', () => {
    expect(hasQuizContent(baseTopic, [])).toBe(false);
  });
});
