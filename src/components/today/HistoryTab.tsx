"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { History, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { formatRelativeTime, DIFFICULTY_CONFIG } from "@/lib/constants";
import { isToday, isYesterday, format } from "date-fns";

const variantClass: Record<string, string> = {
  "sl-relearn": "border-sl-relearn/40 text-sl-relearn bg-sl-relearn/10",
  "sl-hard": "border-sl-hard/40 text-sl-hard bg-sl-hard/10",
  "sl-medium": "border-sl-medium/40 text-sl-medium bg-sl-medium/10",
  "sl-easy": "border-sl-easy/40 text-sl-easy bg-sl-easy/10",
};

type Filter = "all" | "with-notes";

function dateLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

export function HistoryTab() {
  const router = useRouter();
  const { reviewHistory, topics } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const sorted = [...reviewHistory].sort(
      (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
    );
    if (filter === "with-notes") {
      return sorted.filter((e) => e.commitMessage);
    }
    return sorted;
  }, [reviewHistory, filter]);

  const grouped = useMemo(() => {
    const groups: { label: string; entries: typeof filtered }[] = [];
    for (const entry of filtered) {
      const date = new Date(entry.reviewedAt);
      const label = dateLabel(date);
      const group = groups.find((g) => g.label === label);
      if (group) {
        group.entries.push(entry);
      } else {
        groups.push({ label, entries: [entry] });
      }
    }
    return groups;
  }, [filtered]);

  const topicName = (topicId: string): string => {
    return topics.find((t) => t.id === topicId)?.title ?? "Unknown topic";
  };

  if (reviewHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <History className="size-12 text-muted-foreground/40" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your study history will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            filter === "all"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("with-notes")}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            filter === "with-notes"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          With notes
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {grouped.map((group) => (
          <div key={group.label}>
            <p className="mb-2 text-xs font-medium text-muted-foreground px-1">
              {group.label}
            </p>
            <div className="flex flex-col gap-1">
              {group.entries.map((entry) => {
                const config = DIFFICULTY_CONFIG[entry.difficultySelected];
                return (
                  <div
                    key={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/topics/${entry.topicId}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/topics/${entry.topicId}`);
                    }}
                    className="flex flex-col gap-1 rounded-xl px-3 py-2.5 hover:bg-sl-surface-hover transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {topicName(entry.topicId)}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded px-1.5 py-0 text-[11px] font-medium border",
                            variantClass[config.color],
                          )}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {formatRelativeTime(entry.reviewedAt)}
                      </p>
                    </div>
                    {entry.commitMessage && (
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="size-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                        <p className="text-[12px] text-muted-foreground/70">
                          {entry.commitMessage}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
