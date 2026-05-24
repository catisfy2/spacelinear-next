"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface TodayDropZoneProps {
  children: React.ReactNode;
  className?: string;
}

export function TodayDropZone({ children, className }: TodayDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: "today-zone",
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-colors",
        isOver && "bg-accent/20 ring-2 ring-dashed ring-primary/40",
        className,
      )}
    >
      {children}
      {isOver && (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            Drop to schedule for today
          </span>
        </div>
      )}
    </div>
  );
}
