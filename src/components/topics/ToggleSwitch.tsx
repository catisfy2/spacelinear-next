"use client";

import { cn } from "@/lib/utils";

export type ToggleMode = "topics" | "subjects";

export function TopicsSubjectsToggle({
  value,
  onChange,
}: {
  value: ToggleMode;
  onChange: (value: ToggleMode) => void;
}) {
  return (
    <div className="border border-[rgba(211,138,95,0.7)] border-solid flex items-center rounded-[33px]">
      <button
        type="button"
        onClick={() => onChange("topics")}
        className={cn(
          "flex items-center justify-center px-[22px] py-[8px] rounded-[33px] text-[20px] font-medium whitespace-nowrap transition-colors",
          value === "topics"
            ? "bg-primary text-background"
            : "text-card-foreground opacity-60 hover:opacity-100",
        )}
      >
        Topics
      </button>
      <button
        type="button"
        onClick={() => onChange("subjects")}
        className={cn(
          "flex items-center justify-center px-[22px] py-[8px] rounded-[33px] text-[20px] font-medium whitespace-nowrap transition-colors",
          value === "subjects"
            ? "bg-primary text-background"
            : "text-card-foreground opacity-60 hover:opacity-100",
        )}
      >
        Subjects
      </button>
    </div>
  );
}
