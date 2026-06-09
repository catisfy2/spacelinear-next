"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface StudyModeTimerProps {
  initialMinutes: number;
  onTimeUp: () => void;
}

export function StudyModeTimer({
  initialMinutes,
  onTimeUp,
}: StudyModeTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasEndedRef = useRef(false);

  const cleanupFlash = useCallback(() => {
    if (flashTimerRef.current) {
      clearInterval(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    setIsFlashing(false);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsActive(false);

          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            // Flash effect
            let flashCount = 0;
            flashTimerRef.current = setInterval(() => {
              flashCount++;
              setIsFlashing((p) => !p);
              if (flashCount >= 8) {
                cleanupFlash();
                onTimeUp();
              }
            }, 300);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      cleanupFlash();
    };
  }, [isActive, onTimeUp, cleanupFlash]);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = initialMinutes > 0 ? totalSeconds / (initialMinutes * 60) : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center gap-[6px]">
      {/* Circular progress ring */}
      <svg
        width="128"
        height="128"
        viewBox="0 0 128 128"
        className="drop-shadow-lg"
      >
        <circle
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke="white"
          strokeWidth="3"
          opacity={0.15}
        />
        <circle
          cx="64"
          cy="64"
          r="54"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 64 64)"
          className="transition-all duration-1000 ease-linear"
          opacity={0.7}
        />
      </svg>

      {/* Time display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "font-mono text-[36px] font-bold tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-colors duration-150",
            isFlashing && "text-red-400 drop-shadow-[0_0_20px_rgba(255,80,80,0.8)]",
          )}
        >
          {timeStr}
        </span>
      </div>

      {totalSeconds === 0 && (
        <p className="mt-1 animate-pulse text-[13px] font-medium text-white/80 drop-shadow">
          Time&rsquo;s up!
        </p>
      )}
    </div>
  );
}
