"use client";

import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const DURATION_MINUTES = [5, 15, 25] as const;

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function IceStudyTimer() {
  const [durationMinutes, setDurationMinutes] = useState<(typeof DURATION_MINUTES)[number]>(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? Math.min(1, elapsedSeconds / totalSeconds) : 0;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const isComplete = elapsedSeconds >= totalSeconds && totalSeconds > 0;

  useEffect(() => {
    if (!isRunning || isComplete) return;

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        if (next >= totalSeconds) {
          setIsRunning(false);
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, isComplete, totalSeconds]);

  const handleDurationChange = (minutes: (typeof DURATION_MINUTES)[number]) => {
    if (isRunning) return;
    setDurationMinutes(minutes);
    setElapsedSeconds(0);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const waterHeight = 12 + progress * 72;
  const iceScale = 1 - progress * 0.92;
  const iceOpacity = 1 - progress * 0.85;

  return (
    <section className="rounded-[28px] px-5 py-4 space-y-3 bg-card text-foreground shadow-xl border border-border">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-[0.06em]">
          Study until the ice melts
        </h3>
        <span
          className={cn(
            'font-mono text-sm tabular-nums',
            isComplete ? 'text-sl-easy' : 'text-foreground',
          )}
        >
          {isComplete ? 'Done' : formatTime(remainingSeconds)}
        </span>
      </div>

      <div
        className="relative h-36 w-full overflow-hidden rounded-2xl border border-sky-200/60 dark:border-sky-800/50"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/90 via-sky-100/40 to-sky-200/70 dark:from-sky-950/80 dark:via-sky-900/50 dark:to-sky-800/40" />

        <div
          className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-linear"
          style={{ height: `${waterHeight}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-sky-400/70 via-sky-300/50 to-sky-200/30 dark:from-sky-600/60 dark:via-sky-500/40 dark:to-sky-400/20" />
          <div
            className="absolute left-0 right-0 top-0 h-2 -translate-y-1/2 rounded-full bg-sky-200/50 dark:bg-sky-300/30 blur-[1px]"
            style={{ opacity: 0.4 + progress * 0.5 }}
          />
        </div>

        <div
          className="absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-linear"
          style={{
            bottom: `calc(${waterHeight}% - 4px)`,
            transform: `translateX(-50%) scale(${iceScale})`,
            opacity: iceOpacity,
          }}
        >
          <div className="relative h-16 w-14">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/95 via-sky-50/90 to-sky-100/70 border border-white/80 shadow-[inset_0_2px_8px_rgba(255,255,255,0.9),0_4px_12px_rgba(56,189,248,0.25)] dark:from-sky-100/30 dark:via-sky-200/20 dark:to-sky-300/10 dark:border-sky-100/20" />
            <div className="absolute inset-x-2 top-2 h-1 rounded-full bg-white/70" />
            <div className="absolute right-2 top-4 h-6 w-0.5 rounded-full bg-white/40 rotate-12" />
            {progress > 0.15 && (
              <div
                className="absolute -bottom-1 left-1/2 h-3 w-1 -translate-x-1/2 rounded-full bg-sky-300/70 animate-pulse"
                style={{ opacity: Math.min(1, (progress - 0.15) * 2) }}
              />
            )}
          </div>
        </div>

        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-900/10 dark:bg-sky-950/30">
            <p className="text-xs font-medium text-sky-700 dark:text-sky-200 bg-card/80 px-3 py-1 rounded-full border border-sky-200/60 dark:border-sky-700/50 shadow-sm">
              Ice melted — nice focus session
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {DURATION_MINUTES.map(minutes => (
            <button
              key={minutes}
              type="button"
              disabled={isRunning}
              onClick={() => handleDurationChange(minutes)}
              className={cn(
                'flex-1 rounded-lg border py-1 text-[11px] font-medium transition-colors',
                durationMinutes === minutes
                  ? 'border-sky-300/80 bg-sky-100/60 text-sky-900 dark:border-sky-600/60 dark:bg-sky-900/50 dark:text-sky-100'
                  : 'border-border text-muted-foreground hover:bg-accent/50',
                isRunning && 'opacity-50 cursor-not-allowed',
              )}
            >
              {minutes}m
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isComplete ? handleReset() : setIsRunning(prev => !prev))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors"
          aria-label={isComplete ? 'Reset timer' : isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isComplete ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : isRunning ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5" />
          )}
        </button>

        {!isComplete && elapsedSeconds > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        {isRunning
          ? 'Stay with the material until the ice is gone.'
          : isComplete
            ? 'Session complete. Reset to melt another block.'
            : 'Pick a duration and start — the ice melts as you study.'}
      </p>
    </section>
  );
}
