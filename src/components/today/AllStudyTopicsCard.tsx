"use client";

import { useMemo, useCallback, forwardRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ClipboardList, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { StudyModeOverlay } from "@/components/study-mode";
import type { Topic, Subject } from "@/lib/types";

function bulletColor(topic: Topic): string {
  if (topic.currentDifficulty === "relearn") return "bg-sl-relearn";
  if (topic.currentDifficulty === "hard") return "bg-sl-hard";
  if (topic.currentDifficulty === "medium") return "bg-sl-medium";
  if (topic.currentDifficulty === "easy") return "bg-sl-easy";
  return "bg-sl-new";
}

export const AllStudyTopicsCard = forwardRef<
  HTMLDivElement,
  { topics: Topic[]; subjects: Subject[] }
>(function AllStudyTopicsCard({ topics, subjects }, ref) {
  const router = useRouter();

  const dueTopics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return topics.filter((t) => {
      if (t.state === "backlog") return false;
      const d = new Date(t.nextReviewDate);
      d.setHours(0, 0, 0, 0);
      return d < tomorrow;
    });
  }, [topics]);

  const [showStudyOverlay, setShowStudyOverlay] = useState(false);

  const handleStartStudy = useCallback(() => {
    setShowStudyOverlay(true);
  }, []);

  const handleQuizTest = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  return (
    <>
      {showStudyOverlay && (
        <StudyModeOverlay
          minutes={30}
          onClose={() => setShowStudyOverlay(false)}
        />
      )}
      <div
        ref={ref}
        className="flex w-full flex-col items-center justify-center px-[31px] py-[59px]"
      >
        <div className="flex w-full max-w-[816px] flex-col items-center gap-[19px]">
          {/* ── Topics Card ── */}
          <div className="flex w-full flex-col gap-0 overflow-clip rounded-[24px] border border-border bg-card shadow-[inset_0px_10px_13.6px_-14px_hsl(var(--primary)),inset_0px_-6px_32.2px_-14px_hsl(var(--primary))]">
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
                    {dueTopics.length > 0
                      ? `${dueTopics.length} topic${dueTopics.length !== 1 ? "s" : ""} due`
                      : "No pending reviews"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-5 border-t border-border/50" />

            {/* Topics list */}
            <div className="flex flex-col px-5 py-3">
              {dueTopics.length === 0 ? (
                <div className="flex flex-col items-center py-8 px-2">
                  <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5">
                    <Sparkles className="size-6 text-primary/60" />
                  </div>
                  <p className="text-center text-sm font-medium text-foreground">
                    All caught up!
                  </p>
                  <p className="mt-1 text-center text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                    No topics due for review. Upload study materials or create
                    topics to start learning.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {dueTopics.map((topic) => {
                    const subject = subjects.find(
                      (s) => s.id === topic.subjectId,
                    );
                    return (
                      <div
                        key={topic.id}
                        className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-accent/50 -mx-2.5"
                      >
                        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {subject && (
                            <SubjectIcon name={subject.icon} size={18} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-[15px] font-medium text-foreground">
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
                              <span className="text-xs text-muted-foreground truncate">
                                {subject.name}
                              </span>
                            )}
                            {topic.streak > 1 && (
                              <span className="text-xs text-amber-500">
                                🔥 {topic.streak}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize",
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
              )}
            </div>

            {dueTopics.length > 0 && (
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

          {/* ── Action Buttons ── */}
          <div className="flex w-full gap-[11px]">
            <button
              type="button"
              onClick={handleStartStudy}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-[22px] bg-primary/10 px-8 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <Sparkles className="size-4" />
              Start Study Mode
            </button>
            <button
              type="button"
              onClick={handleQuizTest}
              className="flex flex-1 items-center justify-center gap-2.5 rounded-[22px] bg-muted px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ClipboardList className="size-4" />
              Take a Quiz
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
