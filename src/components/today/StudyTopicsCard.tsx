"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, ChevronRight, Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import type { Topic, Subject } from "@/lib/types";

function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

export function StudyTopicsCard({
  topics,
  subjects,
  onExpand,
}: {
  topics: Topic[];
  subjects: Subject[];
  onExpand?: () => void;
}) {
  const router = useRouter();

  const displayTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics
      .filter((t) => {
        if (t.state === "backlog") return false;
        const d = new Date(t.nextReviewDate);
        d.setHours(0, 0, 0, 0);
        return d < tomorrow;
      })
      .slice(0, 4);
  }, [topics]);

  // Stats for the card header
  const totalDue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics.filter((t) => {
      if (t.state === "backlog") return false;
      const d = new Date(t.nextReviewDate);
      d.setHours(0, 0, 0, 0);
      return d < tomorrow;
    }).length;
  }, [topics]);

  const hasTopics = displayTopics.length > 0;

  return (
    <div className="flex w-[354px] shrink-0 flex-col gap-0 overflow-clip rounded-[24px] border border-border bg-card shadow-[inset_0px_10px_13.6px_-14px_hsl(var(--primary)),inset_0px_-6px_32.2px_-14px_hsl(var(--primary))]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Today&rsquo;s Study
            </p>
            <p className="text-[11px] text-muted-foreground">
              {hasTopics
                ? `${totalDue} topic${totalDue !== 1 ? "s" : ""} due`
                : "No pending reviews"}
            </p>
          </div>
        </div>
        {hasTopics && (
          <button
            type="button"
            onClick={onExpand}
            className="flex size-7 items-center justify-center rounded-full hover:bg-accent transition-colors"
            aria-label="See all study topics"
          >
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-border/50" />

      {/* Content */}
      <div className="flex flex-col px-5 py-3">
        {hasTopics ? (
          <div className="flex flex-col gap-1.5">
            {displayTopics.map((topic) => {
              const subject = subjects.find((s) => s.id === topic.subjectId);
              return (
                <div
                  key={topic.id}
                  className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-accent/50 -mx-2.5"
                >
                  {/* Bullet + Icon */}
                  <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {subject && <SubjectIcon name={subject.icon} size={16} />}
                  </div>

                  {/* Topic info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {topic.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={cn(
                          "inline-block size-1.5 rounded-full",
                          bulletColor(topic),
                        )}
                      />
                      {subject && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {subject.name}
                        </span>
                      )}
                      {topic.streak > 1 && (
                        <span className="text-[11px] text-amber-500">
                          🔥 {topic.streak}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Difficulty badge */}
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                      topic.currentDifficulty === "easy" &&
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      topic.currentDifficulty === "medium" &&
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      topic.currentDifficulty === "hard" &&
                        "bg-red-500/10 text-red-600 dark:text-red-400",
                      (!topic.currentDifficulty ||
                        topic.currentDifficulty === "relearn") &&
                        "bg-muted text-muted-foreground",
                    )}
                  >
                    {topic.currentDifficulty === "relearn"
                      ? "relearn"
                      : topic.currentDifficulty || "new"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center py-6 px-2">
            <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
              <Sparkles className="size-6 text-primary/60" />
            </div>
            <p className="text-center text-sm font-medium text-foreground">
              All caught up!
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              No topics due for review right now. Create a topic or upload study
              material to get started.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/topics"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3.5 py-2 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                <Plus className="size-3.5" />
                New Topic
              </Link>
              <button
                type="button"
                onClick={() =>
                  router.push("/chat?q=I want to create a study plan")
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Calendar className="size-3.5" />
                Study Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {hasTopics && (
        <>
          <div className="mx-5 border-t border-border/50" />
          <Link
            href="/topics"
            className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            View all topics
            <ChevronRight className="size-3" />
          </Link>
        </>
      )}
    </div>
  );
}
