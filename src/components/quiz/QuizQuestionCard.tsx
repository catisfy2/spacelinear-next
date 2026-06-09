"use client";

import { QuestionTypeRenderer } from "./QuestionTypeRenderer";
import type { QuestionType } from "@/types/quiz";

interface QuizQuestionCardProps {
  question: string;
  options: string[];
  questionType: QuestionType;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}

export function QuizQuestionCard({
  question,
  options,
  questionType,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswer,
}: QuizQuestionCardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {questionType === "mcq"
            ? "Multiple Choice"
            : questionType === "true_false"
              ? "True / False"
              : "Short Answer"}
        </span>
      </div>

      <h2 className="text-lg font-medium text-foreground">{question}</h2>

      <QuestionTypeRenderer
        questionType={questionType}
        options={options}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
        disabled={false}
      />
    </div>
  );
}
