"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatNextReview, DIFFICULTY_CONFIG } from "@/lib/constants";
import type { Topic, Subject } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

const DIFFICULTY_BG_CLASS: Record<string, string> = {
  relearn: "bg-sl-relearn/10 text-sl-relearn",
  hard: "bg-sl-hard/10 text-sl-hard",
  medium: "bg-sl-medium/10 text-sl-medium",
  easy: "bg-sl-easy/10 text-sl-easy",
};

export function TopicRow({
  topic,
  subject,
  selected,
  onToggle,
  className,
}: {
  topic: Topic;
  subject?: Subject;
  selected?: boolean;
  onToggle?: (id: string) => void;
  className?: string;
}) {
  const router = useRouter();
  const isDue = new Date(topic.nextReviewDate) <= new Date();
  const statusDisplay =
    topic.state === "new" || topic.state === "backlog"
      ? "New"
      : isDue
        ? "Due Now"
        : formatNextReview(topic.nextReviewDate);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group flex w-full items-center justify-between px-[14px] py-[8px] transition-colors rounded-xl cursor-pointer",
        selected
          ? "bg-sl-surface-hover"
          : "hover:bg-sl-surface-hover",
        className,
      )}
      onClick={() => router.push(`/topics/${topic.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/topics/${topic.id}`);
      }}
    >
      <div className="flex items-center gap-[17px]">
        <Checkbox
          checked={selected}
          className={cn(
            "size-[16px]",
            selected ? "visible" : "invisible group-hover:visible",
          )}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onToggle?.(topic.id)}
        />
        <span className="font-medium text-[14px] text-foreground whitespace-nowrap">
          {topic.title}
        </span>
      </div>
      <div className="flex items-center gap-[45px]">
        {subject && (
          <span className="font-medium text-[14px] text-muted-foreground whitespace-nowrap">
            {subject.icon} {subject.name}
          </span>
        )}
        {topic.currentDifficulty && (
          <span
            className={cn(
              "flex items-center justify-center px-[18px] py-[6px] rounded-full text-[12px] font-medium whitespace-nowrap",
              DIFFICULTY_BG_CLASS[topic.currentDifficulty] ?? "",
            )}
          >
            {DIFFICULTY_CONFIG[topic.currentDifficulty]?.label ?? topic.currentDifficulty}
          </span>
        )}
        <span className="hidden group-hover:inline text-[12px] font-medium text-foreground whitespace-nowrap">
          {topic.totalReviews} {topic.totalReviews === 1 ? "review" : "reviews"}
        </span>
        <span
          className={cn(
            "flex items-center justify-center shrink-0 text-[12px] font-medium whitespace-nowrap",
            statusDisplay === "Due Now" ? "text-sl-relearn" : "text-foreground",
          )}
        >
          {statusDisplay}
        </span>
        <span className="flex items-center justify-center w-[68px] text-[12px] font-medium text-foreground whitespace-nowrap shrink-0">
          {format(new Date(topic.nextReviewDate), "d MMM")}
        </span>
      </div>
    </div>
  );
}
