"use client";

import { useState, useCallback } from "react";
import { Plus, Minus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyModeOverlay } from "@/components/study-mode";

const TIMER_VALUES = [15, 30, 45, 60, 70, 80, 90];

export function StudyModeButton() {
  const [minutes, setMinutes] = useState(30);
  const [hovered, setHovered] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleIncrease = useCallback(() => {
    setMinutes((prev) => {
      const idx = TIMER_VALUES.indexOf(prev);
      if (idx < TIMER_VALUES.length - 1) return TIMER_VALUES[idx + 1];
      return prev;
    });
  }, []);

  const handleDecrease = useCallback(() => {
    setMinutes((prev) => {
      const idx = TIMER_VALUES.indexOf(prev);
      if (idx > 0) return TIMER_VALUES[idx - 1];
      return prev;
    });
  }, []);

  const handleStart = useCallback(() => {
    setShowOverlay(true);
  }, []);

  return (
    <>
      {showOverlay && (
        <StudyModeOverlay
          minutes={minutes}
          onClose={() => setShowOverlay(false)}
        />
      )}
      <div
        className={cn(
          "flex shrink-0 w-[237.5px] h-[67px] items-start justify-center gap-[10px] overflow-clip rounded-[14px] px-[13px] py-[10px] transition-shadow",
          hovered && "shadow-[0_0_6px_hsl(var(--primary))]",
        )}
        style={{ border: "1.5px solid rgba(206, 126, 79, 0.58)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative shrink-0 size-[44px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              alt=""
              src="/assets/today/study-mode.png"
              className="absolute left-[-25%] top-[-25.01%] h-[150.03%] w-[150%] max-w-none"
            />
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <div className="flex flex-col h-[47px] items-center justify-between shrink-0 w-[138px]">
            <div className="flex gap-[8px] items-center shrink-0">
              <button
                type="button"
                onClick={handleDecrease}
                className="size-[14px] shrink-0 text-foreground"
                aria-label="Decrease time"
              >
                <Minus className="size-full" />
              </button>
              <Clock className="size-[14px] text-foreground shrink-0" />
              <p className="text-[16px] font-medium text-foreground whitespace-nowrap shrink-0">
                {minutes} Min
              </p>
              <button
                type="button"
                onClick={handleIncrease}
                className="size-[14px] shrink-0 text-foreground"
                aria-label="Increase time"
              >
                <Plus className="size-full" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleStart}
              className="flex w-full items-center justify-center px-[10px] py-[4px] opacity-70"
            >
              <p className="text-[14px] font-medium text-foreground whitespace-nowrap">
                Start Study Mode
              </p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
