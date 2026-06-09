"use client";

import { useState, useCallback } from "react";
import { Plus, Minus, Clock, MessageCircle, Sparkles } from "lucide-react";
import { StudyModeOverlay } from "@/components/study-mode";

const TIMER_VALUES = [15, 30, 45, 60, 70, 80, 90];

export function StudyModeCard() {
  const [minutes, setMinutes] = useState(30);

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

  const [showOverlay, setShowOverlay] = useState(false);

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
      <div className="relative flex w-full shrink-0 flex-col items-center gap-3 overflow-clip rounded-[14px] bg-card px-5 py-4 shadow-[inset_0px_10px_13.6px_-14px_hsl(var(--primary)),inset_0px_-6px_32.2px_-14px_hsl(var(--primary))]">
        {/* Image */}
        <div className="size-[72px] shrink-0 overflow-clip rounded-[10px] bg-muted">
          <img
            alt=""
            src="/assets/today/study-mode.png"
            className="size-full object-cover"
          />
        </div>

        {/* Label */}
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          <p className="text-xs font-medium text-primary/80 uppercase tracking-wider">
            Study Buddy
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-[13px] text-muted-foreground leading-snug max-w-[200px]">
          Focus with a timer and get help from your AI study buddy.
        </p>

        {/* Timer controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDecrease}
            className="flex size-[22px] items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors"
            aria-label="Decrease time"
          >
            <Minus className="size-3" />
          </button>
          <div className="flex items-center gap-2 min-w-[90px] justify-center">
            <Clock className="size-4 text-foreground" />
            <p className="text-[22px] font-semibold text-foreground tracking-tight">
              {minutes}
            </p>
            <p className="text-[13px] text-muted-foreground">min</p>
          </div>
          <button
            type="button"
            onClick={handleIncrease}
            className="flex size-[22px] items-center justify-center rounded-full border border-border text-foreground hover:bg-accent transition-colors"
            aria-label="Increase time"
          >
            <Plus className="size-3" />
          </button>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={handleStart}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
        >
          <MessageCircle className="size-4" />
          Start Study Mode
        </button>
      </div>
    </>
  );
}
