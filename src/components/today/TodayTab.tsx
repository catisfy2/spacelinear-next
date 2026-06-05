"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { StudyTopicsCard } from "./StudyTopicsCard";
import { AllStudyTopicsCard } from "./AllStudyTopicsCard";
import { StudyModeCard } from "./StudyModeCard";
import { QuizOptionCard } from "./QuizOptionCard";
import { AiPromptInput } from "./AiPromptInput";
import { SuggestionButtons } from "./SuggestionButtons";

function greetingLabel(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export function TodayTab() {
  const { user } = useAuth();
  const { topics, subjects } = useStore();

  const [expanded, setExpanded] = useState(false);
  const touchStartY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExpand = useCallback(() => setExpanded(true), []);

  const handleCollapse = useCallback(() => setExpanded(false), []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!expanded) return;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 80) {
        setExpanded(false);
      }
    },
    [expanded],
  );

  useEffect(() => {
    if (!expanded) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [expanded]);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div
      className="relative flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          "flex flex-col gap-[20px] transition-all duration-300 ease-in-out",
          expanded
            ? "pointer-events-none absolute inset-x-0 top-0 opacity-0 scale-95"
            : "opacity-100 scale-100",
        )}
        aria-hidden={expanded}
      >
        <p className="text-[32px] font-medium text-foreground">
          {greetingLabel()}, {displayName}!
        </p>
        <div className="flex flex-col gap-[10px]">
          <div className="flex gap-[11px]">
            <StudyTopicsCard
              topics={topics}
              subjects={subjects}
              onExpand={handleExpand}
            />
            <div className="flex w-[255px] shrink-0 flex-col gap-[10px]">
              <StudyModeCard />
              <QuizOptionCard />
            </div>
          </div>
          <div className="flex w-full flex-col items-start gap-[8px]">
            <AiPromptInput />
            <SuggestionButtons />
          </div>
        </div>
      </div>

      <div
        className={cn(
          "w-full transition-all duration-300 ease-in-out",
          expanded
            ? "opacity-100 scale-100"
            : "pointer-events-none absolute inset-x-0 top-0 opacity-0 scale-95",
        )}
        aria-hidden={!expanded}
      >
        <AllStudyTopicsCard ref={cardRef} topics={topics} subjects={subjects} />
      </div>
    </div>
  );
}
