"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { Topic, Subject } from "@/lib/types";

interface DraggableTopicItemProps {
  topic: Topic;
  subject?: Subject;
}

export function DraggableTopicItem({
  topic,
  subject,
}: DraggableTopicItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: topic.id,
      data: { topic, subject },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-drag-immediate
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
        isDragging ? "opacity-30" : "hover:bg-accent/50 active:cursor-grabbing",
      )}
    >
      {/* colored bullet */}
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          topic.currentDifficulty === "relearn"
            ? "bg-sl-relearn"
            : topic.currentDifficulty === "hard"
              ? "bg-sl-hard"
              : topic.currentDifficulty === "medium"
                ? "bg-sl-medium"
                : topic.currentDifficulty === "easy"
                  ? "bg-sl-easy"
                  : "bg-sl-new",
        )}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {topic.title}
        </p>
        {subject && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {subject.icon} {subject.name}
          </p>
        )}
      </div>

      {/* drag hint */}
      <span className="shrink-0 text-muted-foreground/40" aria-hidden>
        ⋮⋮
      </span>
    </div>
  );
}
