"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Topic, Subject } from "@/lib/types";
import { TopicStateBadge } from "@/components/app/TopicStateBadge";
import { TopicDifficultyBadge } from "@/components/app/TopicDifficultyBadge";

/** Color for the bullet dot based on current difficulty or state */
function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

interface TodayTopicItemProps {
  topic: Topic;
  subject?: Subject;
  isReviewed: boolean;
  onReview: (topic: Topic) => void;
  animationDelay?: string;
}

export function TodayTopicItem({
  topic,
  subject,
  isReviewed,
  onReview,
  animationDelay,
}: TodayTopicItemProps) {
  const isDraggable = topic.state === "new" && !isReviewed;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: topic.id,
      data: { topic, subject },
      disabled: !isDraggable,
    });

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <li
      ref={isDraggable ? setNodeRef : undefined}
      style={{
        ...(isDraggable ? dragStyle : undefined),
        ...(animationDelay
          ? { animationDelay, animationFillMode: "backwards" as const }
          : undefined),
      }}
      {...(isDraggable ? listeners : {})}
      {...(isDraggable ? attributes : {})}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
        isReviewed && "opacity-40",
        isDragging && "opacity-30",
        !isReviewed && !isDragging && "hover:bg-accent/40",
        animationDelay && "animate-slide-up",
      )}
    >
      {/* colored bullet */}
      <span
        className={cn("h-2.5 w-2.5 shrink-0 rounded-full", bulletColor(topic))}
        aria-hidden
      />

      {/* topic info — tap to navigate */}
      <Link
        href={`/topics/${topic.id}`}
        className={cn(
          "min-w-0 flex-1",
          isReviewed ? "pointer-events-none" : "",
        )}
      >
        <p
          className={cn(
            "truncate text-sm font-semibold",
            isReviewed
              ? "text-muted-foreground line-through"
              : "text-foreground",
          )}
        >
          {topic.title}
        </p>
        {subject && (
          <p className="mt-0.5 truncate text-xs text-foreground/70">
            {subject.icon} {subject.name}
          </p>
        )}
      </Link>

      {/* drag handle — visible on hover for draggable topics */}
      {isDraggable && (
        <span
          className="shrink-0 cursor-grab text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Drag to backlog"
        >
          ⋮⋮
        </span>
      )}

      {/* topic state badge (for non-new topics) */}
      {topic.state !== "new" && !isReviewed && (
        <div className="hidden shrink-0 sm:block">
          <TopicStateBadge state={topic.state} />
        </div>
      )}

      {/* difficulty badge (for reviewed topics) */}
      {topic.currentDifficulty && !isReviewed && (
        <div className="hidden shrink-0 sm:block">
          <TopicDifficultyBadge difficulty={topic.currentDifficulty} />
        </div>
      )}

      {/* ◯ button — opens review dialog */}
      <button
        type="button"
        onClick={() => onReview(topic)}
        disabled={isReviewed}
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
          isReviewed
            ? "border-muted text-muted-foreground/30 cursor-not-allowed"
            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
        )}
        aria-label={`Review ${topic.title}`}
      >
        ◯
      </button>
    </li>
  );
}
