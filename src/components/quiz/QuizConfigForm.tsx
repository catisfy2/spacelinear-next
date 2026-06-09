"use client";

import type { QuestionDifficulty } from "@/types/quiz";

interface QuizConfig {
  questionCount: number;
  difficulty: QuestionDifficulty | "mixed";
}

export function QuizConfigForm({
  config,
  onChange,
}: {
  config: QuizConfig;
  onChange: (config: QuizConfig) => void;
}) {
  const counts = [5, 10, 15, 20];
  const difficulties: { value: QuestionDifficulty | "mixed"; label: string }[] = [
    { value: "mixed", label: "Mixed" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Number of Questions
        </p>
        <div className="flex gap-2">
          {counts.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onChange({ ...config, questionCount: count })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                config.questionCount === count
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Difficulty</p>
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange({ ...config, difficulty: d.value })}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                config.difficulty === d.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
