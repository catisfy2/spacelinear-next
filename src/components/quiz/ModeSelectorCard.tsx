"use client";

import { cn } from "@/lib/utils";
import type { GenerationMode } from "@/types/quiz";

interface ModeOption {
  mode: GenerationMode;
  label: string;
  description: string;
  icon: string;
}

const modes: ModeOption[] = [
  {
    mode: "today",
    label: "Today's Topics",
    description: "Generate quiz from topics due for review today",
    icon: "📚",
  },
  {
    mode: "topic",
    label: "Pick a Topic",
    description: "Choose from your existing topics",
    icon: "📖",
  },
  {
    mode: "custom",
    label: "Custom Topic",
    description: "Type any topic you want to be quizzed on",
    icon: "✏️",
  },
  {
    mode: "materials",
    label: "From Materials",
    description: "Use your saved study materials as source",
    icon: "📄",
  },
];

export function ModeSelectorCard({
  selected,
  onSelect,
}: {
  selected: GenerationMode | null;
  onSelect: (mode: GenerationMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {modes.map((mode) => (
        <button
          key={mode.mode}
          type="button"
          onClick={() => onSelect(mode.mode)}
          className={cn(
            "flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
            selected === mode.mode
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
          )}
        >
          <span className="text-2xl">{mode.icon}</span>
          <span className="text-sm font-medium text-foreground">
            {mode.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {mode.description}
          </span>
        </button>
      ))}
    </div>
  );
}
