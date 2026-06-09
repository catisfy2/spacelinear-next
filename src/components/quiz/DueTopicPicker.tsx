"use client";

import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export function DueTopicPicker({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const { topics, subjects } = useStore();

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const dueTopics = topics.filter(
    (t) => new Date(t.nextReviewDate) <= today && t.state !== "archived",
  );

  if (dueTopics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No topics due for review today. Try another mode!
      </div>
    );
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        Select topics due for review ({dueTopics.length} available)
      </p>
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {dueTopics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => onToggle(topic.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selectedIds.includes(topic.id)
                ? "bg-primary/10 text-foreground"
                : "hover:bg-accent text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded border transition-colors",
                selectedIds.includes(topic.id)
                  ? "border-primary bg-primary text-white"
                  : "border-border",
              )}
            >
              {selectedIds.includes(topic.id) && (
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="flex-1 truncate">{topic.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {subjectMap.get(topic.subjectId) ?? "General"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
