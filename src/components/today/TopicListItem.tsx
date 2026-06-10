"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReviewTopicDialog } from "./ReviewTopicDialog";
import type { Topic, Subject } from "@/lib/types";

function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

export function TopicListItem({
  topic,
  subject,
}: {
  topic: Topic;
  subject?: Subject;
}) {
  const router = useRouter();
  const [showReview, setShowReview] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/topics/${topic.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter") router.push(`/topics/${topic.id}`);
        }}
        className="flex w-full items-center justify-between px-[10px] py-[4px] cursor-pointer hover:bg-sl-surface-hover rounded-[14px] transition-colors"
      >
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowReview(true);
            }}
            className="shrink-0"
            aria-label="Rate this topic"
          >
            <Circle className="size-[14px] text-foreground/40" strokeWidth={1.5} />
          </button>
          <span
            className={cn(
              "size-[10px] shrink-0 rounded-full",
              bulletColor(topic),
            )}
            aria-hidden
          />
          <p className="text-[18px] font-medium text-foreground whitespace-nowrap">
            {topic.title}
          </p>
        </div>
        {subject && (
          <p className="text-[11px] font-medium text-secondary-foreground whitespace-nowrap shrink-0">
            {subject.name}
          </p>
        )}
      </div>

      <ReviewTopicDialog
        topic={topic}
        open={showReview}
        onClose={() => setShowReview(false)}
      />
    </>
  );
}
