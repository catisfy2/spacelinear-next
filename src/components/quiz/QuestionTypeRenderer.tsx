"use client";

import { cn } from "@/lib/utils";
import type { QuestionType } from "@/types/quiz";

export function QuestionTypeRenderer({
  questionType,
  options,
  selectedAnswer,
  onAnswer,
  disabled,
}: {
  questionType: QuestionType;
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
  disabled: boolean;
}) {
  if (questionType === "mcq") {
    return (
      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(option)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                disabled && "cursor-default opacity-60",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "hover:border-primary hover:bg-primary/5 text-muted-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (questionType === "true_false") {
    return (
      <div className="grid grid-cols-2 gap-4">
        {["True", "False"].map((option) => {
          const isSelected = selectedAnswer === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(option)}
              className={cn(
                "rounded-xl border-2 px-6 py-8 text-center text-lg font-medium transition-all",
                disabled && "cursor-default opacity-60",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (questionType === "short_answer") {
    return (
      <div>
        <textarea
          placeholder="Type your answer..."
          value={selectedAnswer ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={disabled}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:cursor-default disabled:opacity-60"
        />
      </div>
    );
  }

  return null;
}
