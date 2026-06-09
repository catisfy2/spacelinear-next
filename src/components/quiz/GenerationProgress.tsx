"use client";

import { Loader2, Search, Brain, CheckCircle2, XCircle } from "lucide-react";
import type { GenerationStatus } from "@/types/quiz";

const steps: {
  status: GenerationStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  { status: "queued", label: "Queued", icon: <Loader2 className="size-4 animate-spin" /> },
  { status: "searching", label: "Searching the web for resources...", icon: <Search className="size-4" /> },
  { status: "generating", label: "Generating questions with AI...", icon: <Brain className="size-4" /> },
  { status: "complete", label: "Quiz ready!", icon: <CheckCircle2 className="size-4 text-emerald-500" /> },
];

export function GenerationProgress({
  status,
  progress,
  error,
}: {
  status: GenerationStatus;
  progress: number;
  error?: string | null;
}) {
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <XCircle className="size-8 text-red-500" />
        <p className="text-sm font-medium text-red-500">Generation failed</p>
        <p className="text-xs text-muted-foreground">{error ?? "Something went wrong"}</p>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.status === status);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex items-center gap-2">
        {steps.map((step, i) => (
          <div key={step.status} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-0.5 w-8 ${
                  i <= currentStepIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div
              className={`flex size-8 items-center justify-center rounded-full ${
                i < currentStepIndex
                  ? "bg-primary/20 text-primary"
                  : i === currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {status === "queued" && "Starting..."}
        {status === "searching" && "Searching the web for resources..."}
        {status === "generating" && "Generating questions with AI..."}
        {status === "complete" && "Quiz ready! Redirecting..."}
      </p>
    </div>
  );
}
