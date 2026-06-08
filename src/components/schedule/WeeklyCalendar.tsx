"use client";

import { useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // Monday as first day
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatTitle(date: Date): string {
  const { start, end } = getWeekRange(date);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

interface WeeklyCalendarProps {
  currentDate: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  scheduledCounts: Record<string, number>;
}

export function WeeklyCalendar({
  currentDate,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  scheduledCounts,
}: WeeklyCalendarProps) {
  const weekDays = useMemo(() => {
    const { start } = getWeekRange(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getCount = useCallback(
    (date: Date) => {
      const key = date.toDateString();
      return scheduledCounts[key] ?? 0;
    },
    [scheduledCounts],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevWeek}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          {formatTitle(currentDate)}
        </h2>
        <button
          type="button"
          onClick={onNextWeek}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-[11px] font-medium text-muted-foreground py-1"
          >
            {name}
          </div>
        ))}
        {weekDays.map((date) => {
          const count = getCount(date);
          const isSelected = isSameDay(date, selectedDate);
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition-colors",
                isSelected && "bg-accent text-accent-foreground",
                !isSelected && today && "border border-primary/30",
                !isSelected &&
                  !today &&
                  "hover:bg-accent/50 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "text-sm font-semibold",
                  today && !isSelected && "text-primary",
                  isSelected && "text-accent-foreground",
                )}
              >
                {date.getDate()}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold leading-none",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/15 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
