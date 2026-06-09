"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/store/useStore";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";
import { WeeklyCalendar } from "@/components/schedule/WeeklyCalendar";
import { CalendarDays, ArrowLeftToLine, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Topic, Subject } from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }
  if (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  ) {
    return "Tomorrow";
  }
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

function toInputDateValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Quick Date Options ───────────────────────────────────────────────────

const QUICK_OPTIONS = [
  { label: "Today", offset: 0 },
  { label: "Tomorrow", offset: 1 },
  { label: "In 3 days", offset: 3 },
  { label: "Next week", offset: 7 },
];

// ── Topic Row Component ──────────────────────────────────────────────────

function ScheduleTopicRow({
  topic,
  subject,
  onReschedule,
  onMoveToBacklog,
}: {
  topic: Topic;
  subject: Subject | undefined;
  onReschedule: (topicId: string, date: string) => void;
  onMoveToBacklog: (topicId: string) => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);

  const handleQuickSchedule = useCallback(
    (offset: number) => {
      const d = addDays(new Date(), offset);
      d.setHours(0, 0, 0, 0);
      onReschedule(topic.id, d.toISOString());
      setShowReschedule(false);
    },
    [topic.id, onReschedule],
  );

  const handleCustomDate = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) return;
      const d = new Date(val + "T00:00:00");
      onReschedule(topic.id, d.toISOString());
      setShowReschedule(false);
    },
    [topic.id, onReschedule],
  );

  return (
    <div className="group flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/30">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn("size-2.5 shrink-0 rounded-full", bulletColor(topic))}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {topic.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {subject && <span>{subject.name}</span>}
            <span className="capitalize">{topic.state}</span>
            {topic.streak > 0 && (
              <span>
                Streak: {topic.streak}
                {topic.streak === 1 ? " day" : " days"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {/* Reschedule button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReschedule(!showReschedule)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
            aria-label="Reschedule"
          >
            <CalendarPlus className="size-3.5" />
          </button>

          {showReschedule && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowReschedule(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-border bg-popover p-2 shadow-lg">
                <p className="mb-1.5 px-1 text-[11px] font-medium text-muted-foreground">
                  Reschedule to
                </p>
                <div className="flex flex-col gap-0.5">
                  {QUICK_OPTIONS.map((opt) => (
                    <button
                      key={opt.offset}
                      type="button"
                      onClick={() => handleQuickSchedule(opt.offset)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground hover:bg-accent transition-colors"
                    >
                      <CalendarDays className="size-3 text-muted-foreground" />
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 border-t border-border pt-1.5">
                  <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors cursor-pointer">
                    <CalendarDays className="size-3 text-muted-foreground" />
                    <span>Pick date...</span>
                    <input
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      value={toInputDateValue(new Date())}
                      onChange={handleCustomDate}
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Move to backlog */}
        <button
          type="button"
          onClick={() => onMoveToBacklog(topic.id)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
          aria-label="Move to backlog"
        >
          <ArrowLeftToLine className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main Schedule Page ───────────────────────────────────────────────────

export function SchedulePage() {
  const { user } = useAuth();
  const { topics, subjects, scheduleTopicForDate, moveToBacklog, refreshAll } =
    useStore();

  // Refresh data on mount so agent-created items appear immediately
  useEffect(() => {
    if (user) refreshAll(user.id);
  }, [user, refreshAll]);

  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevWeek = useCallback(
    () => setCurrentWeek((prev) => addDays(prev, -7)),
    [],
  );
  const handleNextWeek = useCallback(
    () => setCurrentWeek((prev) => addDays(prev, 7)),
    [],
  );

  // Recompute counts reactively
  const scheduledCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of topics) {
      if (t.state === "backlog") continue;
      const key = new Date(t.nextReviewDate).toDateString();
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [topics]);

  // Topics for the selected date
  const selectedTopics = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return topics.filter((t) => {
      if (t.state === "backlog") return false;
      const d = new Date(t.nextReviewDate);
      d.setHours(0, 0, 0, 0);
      return d >= start && d < end;
    });
  }, [selectedDate, topics]);

  const handleReschedule = useCallback(
    async (topicId: string, date: string) => {
      await scheduleTopicForDate(topicId, date);
    },
    [scheduleTopicForDate],
  );

  const handleMoveToBacklog = useCallback(
    async (topicId: string) => {
      await moveToBacklog(topicId);
    },
    [moveToBacklog],
  );

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentWeek(getMonday(today));
    setSelectedDate(today);
  }, []);

  const totalScheduled = useMemo(
    () => topics.filter((t) => t.state !== "backlog").length,
    [topics],
  );

  const todayCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics.filter((t) => {
      if (t.state === "backlog") return false;
      const d = new Date(t.nextReviewDate);
      d.setHours(0, 0, 0, 0);
      return d >= today && d < tomorrow;
    }).length;
  }, [topics]);

  return (
    <PageShell maxWidth="narrow" className="pb-12">
      <PageHeader
        title="Schedule"
        description="Plan your study sessions across days."
        actions={
          <button
            type="button"
            onClick={handleToday}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          >
            <CalendarDays className="size-3.5" />
            Today
          </button>
        }
      />

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">
            {totalScheduled}
          </span>{" "}
          topics scheduled
        </span>
        <span>
          <span className="font-semibold text-foreground">{todayCount}</span>{" "}
          due today
        </span>
      </div>

      {/* Weekly Calendar */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <WeeklyCalendar
          currentDate={currentWeek}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          scheduledCounts={scheduledCounts}
        />
      </div>

      {/* Selected day topics */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {formatDateLabel(selectedDate)}
          </h3>
          <span className="text-xs text-muted-foreground">
            {selectedTopics.length} topic
            {selectedTopics.length !== 1 ? "s" : ""}
          </span>
        </div>

        {selectedTopics.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
            <CalendarDays className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No topics scheduled for {formatDateShort(selectedDate)}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Schedule topics from the Topics page or reschedule existing ones.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {selectedTopics.map((topic) => {
              const subject = subjects.find((s) => s.id === topic.subjectId);
              return (
                <ScheduleTopicRow
                  key={topic.id}
                  topic={topic}
                  subject={subject}
                  onReschedule={handleReschedule}
                  onMoveToBacklog={handleMoveToBacklog}
                />
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
