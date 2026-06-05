"use client";

import { useState, useCallback } from "react";
import { Plus, Minus, Clock } from "lucide-react";
import { toast } from "sonner";

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

  const handleStart = useCallback(() => {
    toast.info("Study mode coming soon");
  }, []);

  return (
    <div className="relative flex w-full shrink-0 flex-col items-center gap-[10px] overflow-clip rounded-[14px] bg-card px-[13px] py-[10px] shadow-[inset_0px_10px_13.6px_-14px_hsl(var(--primary)),inset_0px_-6px_32.2px_-14px_hsl(var(--primary))]">
      <div className="flex items-center gap-[10px]">
        <div className="size-[50px] shrink-0 overflow-clip rounded-[8px] bg-muted">
          <img
            alt=""
            src="/assets/today/study-mode.png"
            className="size-full object-cover"
          />
        </div>
        <div className="flex flex-col items-center gap-[4px]">
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={handleDecrease}
              className="size-[14px] text-foreground"
              aria-label="Decrease time"
            >
              <Minus className="size-full" />
            </button>
            <div className="flex items-center gap-[4px]">
              <Clock className="size-[14px] text-foreground" />
              <p className="text-[18px] font-medium text-foreground">
                {minutes} Min
              </p>
            </div>
            <button
              type="button"
              onClick={handleIncrease}
              className="size-[14px] text-foreground"
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
            <p className="text-[14px] font-medium text-foreground">
              Start Study Mode
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
