"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DIFFICULTY_CONFIG, formatInterval } from '@/lib/constants';
import { computeQuizResult, type QuizQuestion } from '@/lib/quiz';
import type { Difficulty } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface QuizCardProps {
  questions: QuizQuestion[];
  intervals: Record<Difficulty, number>;
  onConfirm: (difficulty: Difficulty) => void;
}

function RatingButton({
  difficulty,
  intervalDays,
  selected,
  onSelect,
}: {
  difficulty: Difficulty;
  intervalDays: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const colorMap: Record<string, string> = {
    'sl-relearn': 'border-sl-relearn/30 hover:bg-sl-relearn/10 text-sl-relearn',
    'sl-hard': 'border-sl-hard/30 hover:bg-sl-hard/10 text-sl-hard',
    'sl-medium': 'border-sl-medium/30 hover:bg-sl-medium/10 text-sl-medium',
    'sl-easy': 'border-sl-easy/30 hover:bg-sl-easy/10 text-sl-easy',
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-3 transition-colors',
        colorMap[config.color],
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <span className="text-sm font-medium">{config.label}</span>
      <span className="text-xs opacity-70">{formatInterval(intervalDays)}</span>
      <kbd className="mt-0.5 font-mono text-[10px] opacity-40">{config.key}</kbd>
    </button>
  );
}

export function QuizCard({ questions, intervals, onConfirm }: QuizCardProps) {
  const [phase, setPhase] = useState<'questions' | 'result'>('questions');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const currentQuestion = questions[currentIndex];
  const result = useMemo(
    () => computeQuizResult(questions, answers),
    [questions, answers],
  );

  useEffect(() => {
    if (phase === 'result') {
      setSelectedDifficulty(result.suggestedDifficulty);
    }
  }, [phase, result.suggestedDifficulty]);

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
    },
    [currentQuestion],
  );

  const handleNext = useCallback(() => {
    if (!currentQuestion) return;
    if (answers[currentQuestion.id] === undefined) return;

    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  }, [answers, currentIndex, currentQuestion, questions.length]);

  useEffect(() => {
    if (phase !== 'questions') return;

    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const optionIndex = Number(event.key) - 1;
      if (optionIndex >= 0 && optionIndex < currentQuestion.options.length) {
        event.preventDefault();
        handleSelectOption(optionIndex);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, currentQuestion, handleNext, handleSelectOption]);

  useEffect(() => {
    if (phase !== 'result') return;

    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const keyMap: Record<string, Difficulty> = {
        '1': 'relearn',
        '2': 'hard',
        '3': 'medium',
        '4': 'easy',
      };

      if (keyMap[event.key]) {
        event.preventDefault();
        setSelectedDifficulty(keyMap[event.key]);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        onConfirm(selectedDifficulty);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, onConfirm, selectedDifficulty]);

  if (phase === 'result') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-4 text-center">
          <p className="text-sm text-muted-foreground">Quiz score</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {result.correctCount}/{result.totalCount}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{result.scorePercent}% correct</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Review breakdown
          </p>
          <div className="space-y-2">
            {questions.map((question) => {
              const selected = answers[question.id];
              const isCorrect = selected === question.correctIndex;
              return (
                <div
                  key={question.id}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                    isCorrect
                      ? 'border-sl-easy/30 bg-sl-easy/5'
                      : 'border-sl-relearn/30 bg-sl-relearn/5',
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sl-easy" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-sl-relearn" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{question.question}</p>
                    {!isCorrect && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Correct: {question.options[question.correctIndex]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggested rating (override if needed)
          </p>
          <div className="flex gap-2">
            {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((difficulty) => (
              <RatingButton
                key={difficulty}
                difficulty={difficulty}
                intervalDays={intervals[difficulty]}
                selected={selectedDifficulty === difficulty}
                onSelect={() => setSelectedDifficulty(difficulty)}
              />
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={() => onConfirm(selectedDifficulty)}>
          Confirm rating · <kbd className="ml-1 font-mono text-xs opacity-60">Enter</kbd>
        </Button>
      </div>
    );
  }

  const selectedOption = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium uppercase tracking-wide">Quiz</span>
        <span className="font-mono">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div>
        <h2 className="text-lg font-medium text-foreground">{currentQuestion.question}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Press 1–{currentQuestion.options.length} to select · Enter to continue
        </p>
      </div>

      <div className="space-y-2">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedOption === index;
          return (
            <button
              key={`${currentQuestion.id}-${index}`}
              type="button"
              onClick={() => handleSelectOption(index)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:bg-accent/50 text-foreground',
              )}
            >
              <kbd className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-background font-mono text-xs text-muted-foreground">
                {index + 1}
              </kbd>
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      <Button
        className="w-full"
        onClick={handleNext}
        disabled={selectedOption === undefined}
      >
        {currentIndex + 1 >= questions.length ? 'See results' : 'Next question'} ·{' '}
        <kbd className="ml-1 font-mono text-xs opacity-60">Enter</kbd>
      </Button>
    </div>
  );
}
