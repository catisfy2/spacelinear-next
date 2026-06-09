"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatNextReview, DIFFICULTY_CONFIG } from "@/lib/constants";
import type { Topic, Subject } from "@/lib/types";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";

function formatSafeDate(
  dateStr: string | null | undefined,
  dateFormat: string,
): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return format(date, dateFormat);
}

const DIFFICULTY_BG_CLASS: Record<string, string> = {
  relearn: "bg-sl-relearn/10 text-sl-relearn",
  hard: "bg-sl-hard/10 text-sl-hard",
  medium: "bg-sl-medium/10 text-sl-medium",
  easy: "bg-sl-easy/10 text-sl-easy",
};

function UncheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d="M2 3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H12.6667C13.0203 2 13.3594 2.14048 13.6095 2.39052C13.8595 2.64057 14 2.97971 14 3.33333V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333Z"
        stroke="#606060"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="3"
        fill="hsl(var(--primary))"
      />
      <path
        d="M5 8.5L7 10.5L11 6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopicRow({
  topic,
  subject,
  selected,
  onToggle,
  showSubject = true,
  showDate = false,
  className,
}: {
  topic: Topic;
  subject?: Subject;
  selected?: boolean;
  onToggle?: (id: string) => void;
  showSubject?: boolean;
  showDate?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const isDue = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const d = new Date(topic.nextReviewDate);
    d.setHours(0, 0, 0, 0);
    return d < tomorrow;
  })();
  const statusDisplay =
    topic.state === "new"
      ? "New"
      : topic.state === "backlog"
        ? "Backlog"
        : isDue
          ? "Due Now"
          : formatNextReview(topic.nextReviewDate);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group flex w-full items-center justify-between px-[14px] py-[8px] transition-colors rounded-[14px] cursor-pointer",
        selected ? "bg-sl-surface-hover" : "hover:bg-sl-surface-hover",
        className,
      )}
      onClick={() => router.push(`/topics/${topic.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/topics/${topic.id}`);
      }}
    >
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(topic.id);
          }}
          className="shrink-0"
        >
          {selected ? <CheckIcon /> : <UncheckIcon />}
        </button>
        <span
          className={cn(
            "font-medium text-[16px] whitespace-nowrap transition-colors",
            selected ? "text-[#0f0e0a]" : "text-foreground",
          )}
        >
          {topic.title}
        </span>
      </div>

      <div className="flex items-center gap-[45px]">
        <span className="hidden group-hover:inline text-[12px] font-medium text-black whitespace-nowrap">
          {topic.totalReviews} {topic.totalReviews === 1 ? "review" : "reviews"}
        </span>

        {showSubject && subject && (
          <span className="font-medium text-[14px] text-[#585858] whitespace-nowrap">
            <SubjectIcon name={subject.icon} size={14} /> {subject.name}
          </span>
        )}

        {topic.currentDifficulty && (
          <span
            className={cn(
              "flex items-center justify-center px-[18px] py-[6px] rounded-[30px] text-[12px] font-medium whitespace-nowrap",
              DIFFICULTY_BG_CLASS[topic.currentDifficulty] ?? "",
            )}
          >
            {DIFFICULTY_CONFIG[topic.currentDifficulty]?.label ??
              topic.currentDifficulty}
          </span>
        )}

        <span
          className={cn(
            "flex items-center justify-center shrink-0 text-[12px] font-medium whitespace-nowrap transition-colors",
            selected ? "text-[#0f0e0a]" : "text-foreground",
            statusDisplay === "Due Now" ? "text-sl-relearn" : "",
          )}
        >
          {statusDisplay}
        </span>

        {showDate && (
          <span className="flex items-center justify-center w-[68px] text-[12px] font-medium text-foreground whitespace-nowrap shrink-0">
            {formatSafeDate(topic.nextReviewDate, "d MMM")}
          </span>
        )}
      </div>
    </div>
  );
}
