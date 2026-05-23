import { z } from 'zod';
import type { Difficulty, Resource, Topic } from '@/lib/types';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizResult {
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  suggestedDifficulty: Difficulty;
}

export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correctIndex: z.number().int().min(0),
});

export const quizGenerationSchema = z.object({
  questions: z.array(quizQuestionSchema).min(3).max(5),
});

export type QuizGenerationResult = z.infer<typeof quizGenerationSchema>;

export function scoreToDifficulty(scorePercent: number): Difficulty {
  if (scorePercent <= 25) return 'relearn';
  if (scorePercent <= 50) return 'hard';
  if (scorePercent <= 75) return 'medium';
  return 'easy';
}

export function computeQuizResult(
  questions: QuizQuestion[],
  answers: Record<string, number>,
): QuizResult {
  const totalCount = questions.length;
  const correctCount = questions.reduce((count, question) => {
    const selected = answers[question.id];
    return selected === question.correctIndex ? count + 1 : count;
  }, 0);
  const scorePercent =
    totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
  const suggestedDifficulty = scoreToDifficulty(scorePercent);

  return {
    correctCount,
    totalCount,
    scorePercent,
    suggestedDifficulty,
  };
}

export function normalizeQuizQuestions(
  questions: QuizGenerationResult['questions'],
): QuizQuestion[] {
  return questions
    .map((question, index) => {
      const maxIndex = question.options.length - 1;
      const correctIndex = Math.min(Math.max(0, question.correctIndex), maxIndex);
      return {
        id: question.id || `q-${index + 1}`,
        question: question.question.trim(),
        options: question.options.map((option) => option.trim()).filter(Boolean),
        correctIndex,
      };
    })
    .filter((question) => question.options.length >= 2);
}

export function hasQuizContent(topic: Topic, topicResources: Resource[]): boolean {
  const hasNotes = Boolean(topic.notes?.trim());
  const hasResources = topicResources.length > 0;
  return hasNotes || hasResources;
}

export function buildQuizContext(
  topic: Pick<Topic, 'title' | 'description' | 'notes'>,
  resources: Pick<Resource, 'title' | 'type' | 'url' | 'content'>[],
): string {
  const sections: string[] = [`Topic: ${topic.title}`];

  if (topic.description?.trim()) {
    sections.push(`Description:\n${topic.description.trim()}`);
  }

  if (topic.notes?.trim()) {
    sections.push(`Notes:\n${topic.notes.trim()}`);
  }

  if (resources.length > 0) {
    const resourceLines = resources.map((resource) => {
      const parts = [`- ${resource.title} (${resource.type})`];
      if (resource.url?.trim()) parts.push(`  URL: ${resource.url.trim()}`);
      if (resource.content?.trim()) parts.push(`  Content: ${resource.content.trim()}`);
      return parts.join('\n');
    });
    sections.push(`Resources:\n${resourceLines.join('\n')}`);
  }

  return sections.join('\n\n');
}
